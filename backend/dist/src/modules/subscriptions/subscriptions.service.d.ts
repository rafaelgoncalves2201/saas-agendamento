import { PrismaService } from '../../database/prisma.service';
import { AsaasProvider } from '../payments/asaas.provider';
import { CheckoutSubscriptionDto } from './dto/checkout.dto';
export declare class SubscriptionsService {
    private prisma;
    private asaasProvider;
    constructor(prisma: PrismaService, asaasProvider: AsaasProvider);
    checkout(companyId: string, dto: CheckoutSubscriptionDto): Promise<{
        success: boolean;
        message: string;
        subscription: {
            plan: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string;
                priceMonthly: import("@prisma/client/runtime/library").Decimal;
                priceYearly: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                maxProfessionals: number;
                maxAppointmentsPerMonth: number;
                maxWhatsappMessages: number;
                features: import("@prisma/client/runtime/library").JsonValue;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            provider: string;
            providerCustomerId: string | null;
            providerSubscriptionId: string | null;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            billingCycle: import(".prisma/client").$Enums.BillingCycle;
            amount: import("@prisma/client/runtime/library").Decimal;
            nextDueDate: Date | null;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            canceledAt: Date | null;
            trialEndsAt: Date | null;
            planId: string;
        };
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            providerPaymentId: string;
            dueDate: Date;
            paidAt: Date | null;
            invoiceUrl: string | null;
            subscriptionId: string | null;
        };
        paymentUrl: any;
    }>;
    getMe(companyId: string): Promise<{
        companyId: string;
        subscription: null;
        access: {
            hasActiveSubscription: boolean;
            isExpired: boolean;
            canUseSystem: boolean;
        };
    } | {
        companyId: string;
        subscription: {
            id: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            plan: {
                id: string;
                name: string;
                slug: string;
                features: import("@prisma/client/runtime/library").JsonValue;
            };
            billingCycle: import(".prisma/client").$Enums.BillingCycle;
            amount: import("@prisma/client/runtime/library").Decimal;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            trialEndsAt: Date | null;
        };
        access: {
            hasActiveSubscription: boolean;
            isExpired: boolean;
            canUseSystem: boolean;
        };
    }>;
    getFeatures(companyId: string): Promise<{
        plan: string;
        subscriptionStatus: import(".prisma/client").$Enums.SubscriptionStatus;
        features: {
            maxProfessionals: number;
            maxAppointments: number;
            maxWhatsappMessages: number;
            whatsappNotifications: boolean;
            customBranding: boolean;
            advancedReports: boolean;
            products: boolean;
        };
        usage: {
            currentProfessionals: number;
            currentAppointmentsThisMonth: number;
        };
    }>;
    cancelSubscription(companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        provider: string;
        providerCustomerId: string | null;
        providerSubscriptionId: string | null;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        billingCycle: import(".prisma/client").$Enums.BillingCycle;
        amount: import("@prisma/client/runtime/library").Decimal;
        nextDueDate: Date | null;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        canceledAt: Date | null;
        trialEndsAt: Date | null;
        planId: string;
    }>;
}
