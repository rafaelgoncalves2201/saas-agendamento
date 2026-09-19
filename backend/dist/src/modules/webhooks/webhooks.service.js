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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processAsaasWebhook(tokenHeader, payload) {
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN || 'asaas_secret_webhook_token_2026';
        if (tokenHeader !== expectedToken) {
            this.logger.warn('Tentativa de envio de webhook com token inválido ou ausente');
            throw new common_1.UnauthorizedException('Token de webhook inválido');
        }
        const eventId = payload.id || `evt_${payload.event}_${payload.payment?.id || Date.now()}`;
        const eventType = payload.event;
        this.logger.log(`📥 Webhook recebido: ${eventType} (ID: ${eventId})`);
        const existingEvent = await this.prisma.webhookEvent.findUnique({
            where: { providerEventId: eventId },
        });
        if (existingEvent && existingEvent.status === 'PROCESSED') {
            this.logger.log(`Webhook ${eventId} já processado anteriormente. Ignorando reenvio.`);
            return { received: true, status: 'ALREADY_PROCESSED' };
        }
        await this.prisma.webhookEvent.upsert({
            where: { providerEventId: eventId },
            update: { payload },
            create: {
                provider: 'ASAAS',
                eventType,
                providerEventId: eventId,
                payload,
                status: 'RECEIVED',
            },
        });
        try {
            const paymentData = payload.payment;
            const subscriptionId = paymentData?.subscription;
            if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
                if (subscriptionId) {
                    const subscription = await this.prisma.subscription.findFirst({
                        where: { providerSubscriptionId: subscriptionId },
                        include: { company: true },
                    });
                    if (subscription) {
                        const nextPeriodEnd = subscription.billingCycle === 'YEARLY'
                            ? (0, date_fns_1.addYears)(new Date(), 1)
                            : (0, date_fns_1.addMonths)(new Date(), 1);
                        await this.prisma.subscription.update({
                            where: { id: subscription.id },
                            data: {
                                status: client_1.SubscriptionStatus.ACTIVE,
                                currentPeriodStart: new Date(),
                                currentPeriodEnd: nextPeriodEnd,
                            },
                        });
                        await this.prisma.payment.upsert({
                            where: { providerPaymentId: paymentData.id },
                            update: {
                                status: client_1.PaymentStatus.CONFIRMED,
                                paidAt: new Date(),
                            },
                            create: {
                                companyId: subscription.companyId,
                                subscriptionId: subscription.id,
                                providerPaymentId: paymentData.id,
                                amount: paymentData.value,
                                status: client_1.PaymentStatus.CONFIRMED,
                                paymentMethod: paymentData.billingType === 'PIX' ? 'PIX' : 'CREDIT_CARD',
                                dueDate: new Date(paymentData.dueDate),
                                paidAt: new Date(),
                                invoiceUrl: paymentData.invoiceUrl || null,
                            },
                        });
                        this.logger.log(`✅ Assinatura ativada/renovada com sucesso para empresa ${subscription.company.name}`);
                    }
                }
            }
            else if (eventType === 'PAYMENT_OVERDUE') {
                if (subscriptionId) {
                    const subscription = await this.prisma.subscription.findFirst({
                        where: { providerSubscriptionId: subscriptionId },
                    });
                    if (subscription) {
                        await this.prisma.subscription.update({
                            where: { id: subscription.id },
                            data: { status: client_1.SubscriptionStatus.PAST_DUE },
                        });
                        if (paymentData?.id) {
                            await this.prisma.payment.updateMany({
                                where: { providerPaymentId: paymentData.id },
                                data: { status: client_1.PaymentStatus.FAILED },
                            });
                        }
                        this.logger.warn(`⚠️ Assinatura marcada como PAST_DUE para a empresa ${subscription.companyId}`);
                    }
                }
            }
            else if (eventType === 'SUBSCRIPTION_DELETED' || eventType === 'SUBSCRIPTION_CANCELLED') {
                if (payload.subscription?.id || subscriptionId) {
                    const subProviderId = payload.subscription?.id || subscriptionId;
                    await this.prisma.subscription.updateMany({
                        where: { providerSubscriptionId: subProviderId },
                        data: {
                            status: client_1.SubscriptionStatus.CANCELED,
                            canceledAt: new Date(),
                        },
                    });
                    this.logger.log(`Assinatura ${subProviderId} cancelada via webhook.`);
                }
            }
            await this.prisma.webhookEvent.update({
                where: { providerEventId: eventId },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date(),
                },
            });
            return { received: true, status: 'PROCESSED' };
        }
        catch (err) {
            this.logger.error(`Erro ao processar webhook: ${err.message}`, err.stack);
            await this.prisma.webhookEvent.update({
                where: { providerEventId: eventId },
                data: {
                    status: 'FAILED',
                    errorMessage: err.message,
                },
            });
            throw err;
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map