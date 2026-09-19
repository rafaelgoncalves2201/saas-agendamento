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
    nextDueDate: string;
    cycle: 'MONTHLY' | 'YEARLY';
    description: string;
}
export declare class AsaasProvider {
    private readonly logger;
    private client;
    private isMock;
    constructor();
    createOrGetCustomer(input: AsaasCustomerInput): Promise<any>;
    createSubscription(input: AsaasSubscriptionInput): Promise<any>;
    cancelSubscription(providerSubscriptionId: string): Promise<any>;
}
