export declare class CreatePlanDto {
    name: string;
    slug: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    maxProfessionals: number;
    maxAppointmentsPerMonth: number;
    maxWhatsappMessages: number;
    features: Record<string, any>;
    sortOrder?: number;
}
export declare class UpdatePlanDto {
    name?: string;
    description?: string;
    priceMonthly?: number;
    priceYearly?: number;
    maxProfessionals?: number;
    maxAppointmentsPerMonth?: number;
    maxWhatsappMessages?: number;
    features?: Record<string, any>;
    isActive?: boolean;
    sortOrder?: number;
}
