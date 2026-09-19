import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    getMyCompany(req: any): Promise<{
        subscription: ({
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
        }) | null;
    } & {
        id: string;
        email: string;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        document: string | null;
        logoUrl: string | null;
        coverUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateMyCompany(req: any, dto: UpdateCompanyDto): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        document: string | null;
        logoUrl: string | null;
        coverUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getMembers(req: any): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        companyId: string;
        userId: string;
    })[]>;
    getPublicCompany(slug: string): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string;
        isActive: boolean;
        slug: string;
        logoUrl: string | null;
        coverUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue;
        professionals: {
            id: string;
            name: string;
            phone: string;
            slug: string;
            bio: string | null;
            avatarUrl: string | null;
        }[];
        services: {
            id: string;
            name: string;
            description: string | null;
            sortOrder: number;
            durationMinutes: number;
            price: import("@prisma/client/runtime/library").Decimal;
            category: string | null;
            imageUrl: string | null;
        }[];
    }>;
    listAllCompanies(): Promise<({
        subscription: ({
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
        }) | null;
        _count: {
            members: number;
            professionals: number;
            clients: number;
            appointments: number;
        };
    } & {
        id: string;
        email: string;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        document: string | null;
        logoUrl: string | null;
        coverUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    toggleCompanyStatus(id: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        document: string | null;
        logoUrl: string | null;
        coverUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
