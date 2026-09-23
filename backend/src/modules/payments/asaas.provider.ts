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
        pixQrCode: {
          encodedImage: '',
          payload: '00020126580014BR.GOV.BCB.PIX2536mock_payload',
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
        },
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

      let firstPayment: any = null;
      let pixQrCode: any = null;

      try {
        const paymentsRes = await this.client.get(`/subscriptions/${res.data.id}/payments`);
        if (paymentsRes.data?.data?.length > 0) {
          firstPayment = paymentsRes.data.data[0];

          if (input.billingType === 'PIX' && firstPayment?.id) {
            try {
              const pixRes = await this.client.get(`/payments/${firstPayment.id}/pixQrCode`);
              pixQrCode = pixRes.data;
            } catch (pixErr: any) {
              this.logger.warn(`Não foi possível obter Pix QR Code de imediato: ${pixErr.message}`);
            }
          }
        }
      } catch (pErr: any) {
        this.logger.warn(`Não foi possível recuperar faturas da assinatura de imediato: ${pErr.message}`);
      }

      return {
        ...res.data,
        firstPaymentId: firstPayment?.id || null,
        paymentUrl: firstPayment?.invoiceUrl || res.data.paymentUrl || null,
        bankSlipUrl: firstPayment?.bankSlipUrl || null,
        pixQrCode,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao criar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
      throw new Error(`Falha ao gerar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
    }
  }

  async getSubscriptionPayments(providerSubscriptionId: string) {
    if (this.isMock) {
      return [
        {
          id: `pay_mock_${providerSubscriptionId}`,
          status: 'PENDING', // PENDENTE: Só deve ativar se o banco/Asaas compensar o pagamento real
          value: 49.9,
          billingType: 'PIX',
          paymentDate: null,
        },
      ];
    }

    try {
      const res = await this.client.get(`/subscriptions/${providerSubscriptionId}/payments`);
      return res.data?.data || [];
    } catch (error: any) {
      this.logger.error(
        `Erro ao buscar pagamentos da assinatura no Asaas: ${error.response?.data?.message || error.message}`,
      );
      throw new Error(
        `Falha ao consultar pagamentos no Asaas: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  async getPixQrCode(providerPaymentId: string) {
    if (this.isMock) {
      return {
        encodedImage: '',
        payload: '00020126580014BR.GOV.BCB.PIX2536mock_payload',
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
      };
    }

    try {
      const res = await this.client.get(`/payments/${providerPaymentId}/pixQrCode`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`Erro ao obter QR Code Pix: ${error.response?.data?.message || error.message}`);
      return null;
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

