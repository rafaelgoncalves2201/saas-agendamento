"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AsaasProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsaasProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let AsaasProvider = AsaasProvider_1 = class AsaasProvider {
    logger = new common_1.Logger(AsaasProvider_1.name);
    client;
    isMock;
    constructor() {
        const apiKey = process.env.ASAAS_API_KEY || 'sandbox_mock_key';
        const baseUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
        this.isMock = apiKey === 'sandbox_mock_key' || !apiKey;
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            headers: {
                'access_token': apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        if (this.isMock) {
            this.logger.warn('⚠️ ASAAS_API_KEY não configurada ou usando sandbox_mock_key. AsaasProvider operando em MOCK SIMULADO para desenvolvimento local.');
        }
        else {
            this.logger.log(`💳 AsaasProvider conectado à API: ${baseUrl}`);
        }
    }
    async createOrGetCustomer(input) {
        if (this.isMock) {
            const mockCustomerId = `cus_mock_${Buffer.from(input.email).toString('hex').substring(0, 10)}`;
            this.logger.log(`[MOCK Asaas] Cliente criado/recuperado: ${mockCustomerId} (${input.name})`);
            return { id: mockCustomerId, ...input };
        }
        try {
            const searchRes = await this.client.get('/customers', {
                params: { email: input.email },
            });
            if (searchRes.data?.data?.length > 0) {
                return searchRes.data.data[0];
            }
            const createRes = await this.client.post('/customers', {
                name: input.name,
                email: input.email,
                mobilePhone: input.phone.replace(/\D/g, ''),
                cpfCnpj: input.cpfCnpj ? input.cpfCnpj.replace(/\D/g, '') : undefined,
            });
            return createRes.data;
        }
        catch (error) {
            this.logger.error(`Erro ao criar cliente no Asaas: ${error.response?.data?.message || error.message}`);
            throw new Error(`Falha na integração com gateway Asaas: ${error.response?.data?.message || error.message}`);
        }
    }
    async createSubscription(input) {
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
            let firstPayment = null;
            let pixQrCode = null;
            try {
                const paymentsRes = await this.client.get(`/subscriptions/${res.data.id}/payments`);
                if (paymentsRes.data?.data?.length > 0) {
                    firstPayment = paymentsRes.data.data[0];
                    if (input.billingType === 'PIX' && firstPayment?.id) {
                        try {
                            const pixRes = await this.client.get(`/payments/${firstPayment.id}/pixQrCode`);
                            pixQrCode = pixRes.data;
                        }
                        catch (pixErr) {
                            this.logger.warn(`Não foi possível obter Pix QR Code de imediato: ${pixErr.message}`);
                        }
                    }
                }
            }
            catch (pErr) {
                this.logger.warn(`Não foi possível recuperar faturas da assinatura de imediato: ${pErr.message}`);
            }
            return {
                ...res.data,
                firstPaymentId: firstPayment?.id || null,
                paymentUrl: firstPayment?.invoiceUrl || res.data.paymentUrl || null,
                bankSlipUrl: firstPayment?.bankSlipUrl || null,
                pixQrCode,
            };
        }
        catch (error) {
            this.logger.error(`Erro ao criar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
            throw new Error(`Falha ao gerar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
        }
    }
    async getSubscriptionPayments(providerSubscriptionId) {
        if (this.isMock) {
            return [
                {
                    id: `pay_mock_${providerSubscriptionId}`,
                    status: 'PENDING',
                    value: 49.9,
                    billingType: 'PIX',
                    paymentDate: null,
                },
            ];
        }
        try {
            const res = await this.client.get(`/subscriptions/${providerSubscriptionId}/payments`);
            return res.data?.data || [];
        }
        catch (error) {
            this.logger.error(`Erro ao buscar pagamentos da assinatura no Asaas: ${error.response?.data?.message || error.message}`);
            throw new Error(`Falha ao consultar pagamentos no Asaas: ${error.response?.data?.message || error.message}`);
        }
    }
    async getPixQrCode(providerPaymentId) {
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
        }
        catch (error) {
            this.logger.error(`Erro ao obter QR Code Pix: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }
    async cancelSubscription(providerSubscriptionId) {
        if (this.isMock) {
            this.logger.log(`[MOCK Asaas] Assinatura cancelada: ${providerSubscriptionId}`);
            return { id: providerSubscriptionId, status: 'CANCELED' };
        }
        try {
            const res = await this.client.delete(`/subscriptions/${providerSubscriptionId}`);
            return res.data;
        }
        catch (error) {
            this.logger.error(`Erro ao cancelar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
            throw new Error(`Falha ao cancelar assinatura no Asaas: ${error.response?.data?.message || error.message}`);
        }
    }
};
exports.AsaasProvider = AsaasProvider;
exports.AsaasProvider = AsaasProvider = AsaasProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AsaasProvider);
//# sourceMappingURL=asaas.provider.js.map