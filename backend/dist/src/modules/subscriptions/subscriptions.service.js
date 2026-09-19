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
        const subscription = await this.prisma.subscription.upsert({
            where: { companyId },
            update: {
                planId: plan.id,
                provider: 'ASAAS',
                providerCustomerId: customer.id,
                providerSubscriptionId: asaasSub.id,
                status: client_1.SubscriptionStatus.ACTIVE,
                billingCycle: dto.billingCycle,
                amount,
                nextDueDate: new Date(dueDate),
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: false,
            },
            create: {
                companyId,
                planId: plan.id,
                provider: 'ASAAS',
                providerCustomerId: customer.id,
                providerSubscriptionId: asaasSub.id,
                status: client_1.SubscriptionStatus.ACTIVE,
                billingCycle: dto.billingCycle,
                amount,
                nextDueDate: new Date(dueDate),
                currentPeriodStart,
                currentPeriodEnd,
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
                status: client_1.PaymentStatus.CONFIRMED,
                paymentMethod: dto.paymentMethod,
                dueDate: new Date(dueDate),
                paidAt: new Date(),
                invoiceUrl: asaasSub.paymentUrl || null,
            },
        });
        return {
            success: true,
            message: 'Assinatura contratada com sucesso!',
            subscription,
            payment,
            paymentUrl: asaasSub.paymentUrl,
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
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        asaas_provider_1.AsaasProvider])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map