import { SubscriptionsService } from './subscriptions.service';
import { CheckoutSubscriptionDto } from './dto/checkout.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    checkout(req: any, dto: CheckoutSubscriptionDto): Promise<{
        success: boolean;
        message: string;
        subscription: {
            plan: {
                id: string;
                name: string;
                slug: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                sortOrder: number;
                priceMonthly: import("@prisma/client/runtime/library").Decimal;
                priceYearly: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                maxProfessionals: number;
                maxAppointmentsPerMonth: number;
                maxWhatsappMessages: number;
                features: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            planId: string;
            provider: string;
            providerCustomerId: string | null;
            providerSubscriptionId: string | null;
            billingCycle: import(".prisma/client").$Enums.BillingCycle;
            amount: import("@prisma/client/runtime/library").Decimal;
            nextDueDate: Date | null;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            canceledAt: Date | null;
            trialEndsAt: Date | null;
        };
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            paidAt: Date | null;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            providerPaymentId: string;
            dueDate: Date;
            invoiceUrl: string | null;
            subscriptionId: string | null;
        };
        paymentUrl: any;
        pixQrCode: any;
    }>;
    getMe(req: any): Promise<{
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
    getFeatures(req: any): Promise<{
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
    syncSubscription(req: any): Promise<{
        synced: boolean;
        active: boolean;
        message: string;
        subscription: {
            plan: {
                id: string;
                name: string;
                slug: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                sortOrder: number;
                priceMonthly: import("@prisma/client/runtime/library").Decimal;
                priceYearly: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                maxProfessionals: number;
                maxAppointmentsPerMonth: number;
                maxWhatsappMessages: number;
                features: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            planId: string;
            provider: string;
            providerCustomerId: string | null;
            providerSubscriptionId: string | null;
            billingCycle: import(".prisma/client").$Enums.BillingCycle;
            amount: import("@prisma/client/runtime/library").Decimal;
            nextDueDate: Date | null;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            canceledAt: Date | null;
            trialEndsAt: Date | null;
        };
        latestPayment?: undefined;
    } | {
        synced: boolean;
        active: boolean;
        message: string;
        subscription: {
            plan: {
                id: string;
                name: string;
                slug: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                sortOrder: number;
                priceMonthly: import("@prisma/client/runtime/library").Decimal;
                priceYearly: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                maxProfessionals: number;
                maxAppointmentsPerMonth: number;
                maxWhatsappMessages: number;
                features: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            planId: string;
            provider: string;
            providerCustomerId: string | null;
            providerSubscriptionId: string | null;
            billingCycle: import(".prisma/client").$Enums.BillingCycle;
            amount: import("@prisma/client/runtime/library").Decimal;
            nextDueDate: Date | null;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            canceledAt: Date | null;
            trialEndsAt: Date | null;
        };
        latestPayment: {
            id: any;
            status: any;
            value: any;
            invoiceUrl: any;
            pixQrCode: null;
        } | null;
    }>;
    cancelSubscription(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        planId: string;
        provider: string;
        providerCustomerId: string | null;
        providerSubscriptionId: string | null;
        billingCycle: import(".prisma/client").$Enums.BillingCycle;
        amount: import("@prisma/client/runtime/library").Decimal;
        nextDueDate: Date | null;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        canceledAt: Date | null;
        trialEndsAt: Date | null;
    }>;
}
