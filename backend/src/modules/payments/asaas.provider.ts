import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface AsaasCustomerInput {
  name: string;
  email: string;
  phone: string;
  cpfCnpj?: string;
}

export interface AsaasSubscriptionInput {
  customer: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'UNDEFINED';
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: 'MONTHLY' | 'YEARLY';
  description: string;
}

@Injectable()
export class AsaasProvider {
  private readonly logger = new Logger(AsaasProvider.name);
  private client: AxiosInstance;
  private isMock: boolean;

  constructor() {
    const apiKey = process.env.ASAAS_API_KEY || 'sandbox_mock_key';
    const baseUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    this.isMock = apiKey === 'sandbox_mock_key' || !apiKey;

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (this.isMock) {
      this.logger.warn('⚠️ ASAAS_API_KEY não configurada ou usando sandbox_mock_key. AsaasProvider operando em MOCK SIMULADO para desenvolvimento local.');
    } else {
      this.logger.log(`💳 AsaasProvider conectado à API: ${baseUrl}`);
    }
  }

  async createOrGetCustomer(input: AsaasCustomerInput) {
    if (this.isMock) {
      const mockCustomerId = `cus_mock_${Buffer.from(input.email).toString('hex').substring(0, 10)}`;
      this.logger.log(`[MOCK Asaas] Cliente criado/recuperado: ${mockCustomerId} (${input.name})`);
      return { id: mockCustomerId, ...input };
    }

    try {
      // Buscar cliente existente por e-mail ou CPF/CNPJ
      const searchRes = await this.client.get('/customers', {
        params: { email: input.email },
      });

      if (searchRes.data?.data?.length > 0) {
        return searchRes.data.data[0];
      }

      // Criar novo cliente
      const createRes = await this.client.post('/customers', {
        name: input.name,
        email: input.email,
        mobilePhone: input.phone.replace(/\D/g, ''),
        cpfCnpj: input.cpfCnpj ? input.cpfCnpj.replace(/\D/g, '') : undefined,
      });

      return createRes.data;
    } catch (error: any) {
      this.logger.error(`Erro ao criar cliente no Asaas: ${error.response?.data?.message || error.message}`);
      throw new Error(`Falha na integração com gateway Asaas: ${error.response?.data?.message || error.message}`);
    }
  }

  async createSubscription(input: AsaasSubscriptionInput) {
    if (this.isMock) {
      const mockSubId = `sub_mock_${Date.now()}`;
      const mockPaymentId = `pay_mock_${Date.now()}`;
      this.logger.log(`[MOCK Asaas] Assinatura criada: ${mockSubId} - Valor: R$ ${input.value}`);

      return {
        id: mockSubId,
        customer: input.customer,
        value: input.value,
        nextDueDate: input.nextDueDate,
        cycle: input.cycle,
        status: 'ACTIVE',
        paymentUrl: `https://sandbox.asaas.com/i/mock_invoice_${mockPaymentId}`,
        firstPaymentId: mockPaymentId,
      };
    }

    try {
      const res = await this.client.post('/subscriptions', {
        customer: input.customer,
        billingType: input.billingType,
        value: input.value,
        nextDueDate: input.nextDueDate,
        cycle: input.cycle,
        description: input.description,
      });

      return res.data;
    } catch (error: any) {
      this.logger.error(`Erro ao criar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
      throw new Error(`Falha ao gerar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
    }
  }

  async cancelSubscription(providerSubscriptionId: string) {
    if (this.isMock) {
      this.logger.log(`[MOCK Asaas] Assinatura cancelada: ${providerSubscriptionId}`);
      return { id: providerSubscriptionId, status: 'CANCELED' };
    }

    try {
      const res = await this.client.delete(`/subscriptions/${providerSubscriptionId}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`Erro ao cancelar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
      throw new Error(`Falha ao cancelar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
    }
  }
}

