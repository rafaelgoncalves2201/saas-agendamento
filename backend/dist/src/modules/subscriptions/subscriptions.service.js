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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const asaas_provider_1 = require("../payments/asaas.provider");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let SubscriptionsService = class SubscriptionsService {
    prisma;
    asaasProvider;
    constructor(prisma, asaasProvider) {
        this.prisma = prisma;
        this.asaasProvider = asaasProvider;
    }
    async checkout(companyId, dto) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const plan = await this.prisma.plan.findUnique({
            where: { id: dto.planId },
        });
        if (!plan || !plan.isActive) {
            throw new common_1.NotFoundException('Plano não encontrado ou indisponível');
        }
        const amount = dto.billingCycle === client_1.BillingCycle.YEARLY
            ? plan.priceYearly
            : plan.priceMonthly;
        const customer = await this.asaasProvider.createOrGetCustomer({
            name: company.name,
            email: company.email,
            phone: company.phone,
            cpfCnpj: dto.cpfCnpj || company.document || undefined,
        });
        const dueDate = (0, date_fns_1.format)((0, date_fns_1.addDays)(new Date(), 1), 'yyyy-MM-dd');
        const asaasBillingType = dto.paymentMethod === client_1.PaymentMethod.PIX
            ? 'PIX'
            : dto.paymentMethod === client_1.PaymentMethod.BOLETO
                ? 'BOLETO'
                : 'CREDIT_CARD';
        const asaasSub = await this.asaasProvider.createSubscription({
            customer: customer.id,
            billingType: asaasBillingType,
            value: Number(amount),
            nextDueDate: dueDate,
            cycle: dto.billingCycle === client_1.BillingCycle.YEARLY ? 'YEARLY' : 'MONTHLY',
            description: `Assinatura Plano ${plan.name} - ${company.name}`,
        });
        const currentPeriodStart = new Date();
        const currentPeriodEnd = dto.billingCycle === client_1.BillingCycle.YEARLY
            ? (0, date_fns_1.addYears)(currentPeriodStart, 1)
            : (0, date_fns_1.addMonths)(currentPeriodStart, 1);
        const currentSub = await this.prisma.subscription.findUnique({
            where: { companyId },
        });
        const initialStatus = client_1.SubscriptionStatus.INCOMPLETE;
        const subscription = await this.prisma.subscription.upsert({
            where: { companyId },
            update: {
                planId: plan.id,
                provider: 'ASAAS',
                providerCustomerId: customer.id,
                providerSubscriptionId: asaasSub.id,
                status: initialStatus,
                billingCycle: dto.billingCycle,
                amount,
                nextDueDate: new Date(dueDate),
                currentPeriodStart,
                currentPeriodEnd,
                trialEndsAt: null,
                cancelAtPeriodEnd: false,
            },
            create: {
                companyId,
                planId: plan.id,
                provider: 'ASAAS',
                providerCustomerId: customer.id,
                providerSubscriptionId: asaasSub.id,
                status: initialStatus,
                billingCycle: dto.billingCycle,
                amount,
                nextDueDate: new Date(dueDate),
                currentPeriodStart,
                currentPeriodEnd,
                trialEndsAt: null,
            },
            include: {
                plan: true,
            },
        });
        const payment = await this.prisma.payment.create({
            data: {
                companyId,
                subscriptionId: subscription.id,
                providerPaymentId: asaasSub.firstPaymentId || `pay_${Date.now()}`,
                amount,
                status: client_1.PaymentStatus.PENDING,
                paymentMethod: dto.paymentMethod,
                dueDate: new Date(dueDate),
                paidAt: null,
                invoiceUrl: asaasSub.paymentUrl || null,
            },
        });
        return {
            success: true,
            message: 'Cobrança gerada com sucesso! Aguardando compensação do pagamento.',
            subscription,
            payment,
            paymentUrl: asaasSub.paymentUrl,
            pixQrCode: asaasSub.pixQrCode,
        };
    }
    async getMe(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const sub = company.subscription;
        if (!sub) {
            return {
                companyId,
                subscription: null,
                access: {
                    hasActiveSubscription: false,
                    isExpired: true,
                    canUseSystem: false,
                },
            };
        }
        const now = new Date();
        const isActive = sub.status === client_1.SubscriptionStatus.ACTIVE && sub.currentPeriodEnd > now;
        const isTrial = sub.status === client_1.SubscriptionStatus.TRIALING &&
            (!sub.trialEndsAt || sub.trialEndsAt > now);
        const canUseSystem = (isActive || isTrial) && company.isActive;
        return {
            companyId,
            subscription: {
                id: sub.id,
                status: sub.status,
                plan: {
                    id: sub.plan.id,
                    name: sub.plan.name,
                    slug: sub.plan.slug,
                    features: sub.plan.features,
                },
                billingCycle: sub.billingCycle,
                amount: sub.amount,
                currentPeriodStart: sub.currentPeriodStart,
                currentPeriodEnd: sub.currentPeriodEnd,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                trialEndsAt: sub.trialEndsAt,
            },
            access: {
                hasActiveSubscription: isActive || isTrial,
                isExpired: !isActive && !isTrial,
                canUseSystem,
            },
        };
    }
    async getFeatures(companyId) {
        const sub = await this.prisma.subscription.findUnique({
            where: { companyId },
            include: { plan: true },
        });
        if (!sub) {
            throw new common_1.NotFoundException('Nenhuma assinatura ativa encontrada');
        }
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const [professionalsCount, appointmentsMonthCount] = await Promise.all([
            this.prisma.professional.count({
                where: { companyId, isActive: true },
            }),
            this.prisma.appointment.count({
                where: {
                    companyId,
                    createdAt: { gte: startOfMonth },
                    status: { not: 'CANCELLED' },
                },
            }),
        ]);
        const featuresObj = sub.plan.features || {};
        return {
            plan: sub.plan.slug.toUpperCase(),
            subscriptionStatus: sub.status,
            features: {
                maxProfessionals: sub.plan.maxProfessionals,
                maxAppointments: sub.plan.maxAppointmentsPerMonth,
                maxWhatsappMessages: sub.plan.maxWhatsappMessages,
                whatsappNotifications: Boolean(featuresObj.whatsappNotifications),
                customBranding: Boolean(featuresObj.customBranding),
                advancedReports: Boolean(featuresObj.advancedReports),
                products: Boolean(featuresObj.products),
            },
            usage: {
                currentProfessionals: professionalsCount,
                currentAppointmentsThisMonth: appointmentsMonthCount,
            },
        };
    }
    async cancelSubscription(companyId) {
        const sub = await this.prisma.subscription.findUnique({
            where: { companyId },
        });
        if (!sub) {
            throw new common_1.NotFoundException('Assinatura não encontrada');
        }
        if (sub.providerSubscriptionId) {
            await this.asaasProvider.cancelSubscription(sub.providerSubscriptionId);
        }
        return this.prisma.subscription.update({
            where: { companyId },
            data: {
                cancelAtPeriodEnd: true,
                canceledAt: new Date(),
            },
        });
    }
    async syncSubscription(companyId) {
        const sub = await this.prisma.subscription.findUnique({
            where: { companyId },
            include: { plan: true },
        });
        if (!sub || !sub.providerSubscriptionId) {
            throw new common_1.NotFoundException('Nenhuma assinatura Asaas vinculada a esta empresa');
        }
        const payments = await this.asaasProvider.getSubscriptionPayments(sub.providerSubscriptionId);
        const confirmedPayment = payments.find((p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
        if (confirmedPayment) {
            const nextPeriodEnd = sub.billingCycle === client_1.BillingCycle.YEARLY
                ? (0, date_fns_1.addYears)(new Date(), 1)
                : (0, date_fns_1.addMonths)(new Date(), 1);
            const updatedSub = await this.prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    status: client_1.SubscriptionStatus.ACTIVE,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: nextPeriodEnd,
                },
                include: { plan: true },
            });
            await this.prisma.payment.upsert({
                where: { providerPaymentId: confirmedPayment.id },
                update: {
                    status: client_1.PaymentStatus.CONFIRMED,
                    paidAt: confirmedPayment.clientPaymentDate
                        ? new Date(confirmedPayment.clientPaymentDate)
                        : new Date(),
                },
                create: {
                    companyId,
                    subscriptionId: sub.id,
                    providerPaymentId: confirmedPayment.id,
                    amount: confirmedPayment.value,
                    status: client_1.PaymentStatus.CONFIRMED,
                    paymentMethod: confirmedPayment.billingType === 'PIX'
                        ? client_1.PaymentMethod.PIX
                        : client_1.PaymentMethod.CREDIT_CARD,
                    dueDate: new Date(confirmedPayment.dueDate),
                    paidAt: new Date(),
                    invoiceUrl: confirmedPayment.invoiceUrl || null,
                },
            });
            return {
                synced: true,
                active: true,
                message: 'Pagamento confirmado pelo banco! Seu plano está 100% ativado.',
                subscription: updatedSub,
            };
        }
        const latestPayment = payments[0] || null;
        let pixQrCode = null;
        if (latestPayment && latestPayment.billingType === 'PIX' && latestPayment.id) {
            pixQrCode = await this.asaasProvider.getPixQrCode(latestPayment.id);
        }
        return {
            synced: true,
            active: sub.status === client_1.SubscriptionStatus.ACTIVE,
            message: 'Pagamento ainda não identificado pelo banco. Se realizou via Pix agora, aguarde até 30 segundos e verifique novamente.',
            subscription: sub,
            latestPayment: latestPayment
                ? {
                    id: latestPayment.id,
                    status: latestPayment.status,
                    value: latestPayment.value,
                    invoiceUrl: latestPayment.invoiceUrl,
                    pixQrCode,
                }
                : null,
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        asaas_provider_1.AsaasProvider])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map