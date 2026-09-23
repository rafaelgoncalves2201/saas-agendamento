import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    listPublicPlans(): Promise<{
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
    }[]>;
    listAllPlans(): Promise<({
        _count: {
            subscriptions: number;
        };
    } & {
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
    })[]>;
    createPlan(dto: CreatePlanDto): Promise<{
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
    }>;
    updatePlan(id: string, dto: UpdatePlanDto): Promise<{
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
    }>;
    deletePlan(id: string): Promise<{
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
    }>;
}
