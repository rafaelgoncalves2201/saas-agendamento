import { BillingCycle, PaymentMethod } from '@prisma/client';
export declare class CheckoutSubscriptionDto {
    planId: string;
    billingCycle: BillingCycle;
    paymentMethod: PaymentMethod;
    cpfCnpj?: string;
}
