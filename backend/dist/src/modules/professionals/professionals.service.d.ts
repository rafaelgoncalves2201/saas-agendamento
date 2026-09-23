import { PrismaService } from '../../database/prisma.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';
export declare class ProfessionalsService {
    private prisma;
    constructor(prisma: PrismaService);
    listProfessionals(companyId: string): Promise<({
        services: ({
            service: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                description: string | null;
                durationMinutes: number;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string | null;
                imageUrl: string | null;
                sortOrder: number;
            };
        } & {
            professionalId: string;
            serviceId: string;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            customDuration: number | null;
        })[];
        availabilities: {
            id: string;
            isActive: boolean;
            companyId: string;
            professionalId: string | null;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            breakStart: string | null;
            breakEnd: string | null;
        }[];
        _count: {
            appointments: number;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        mpAccessToken: string | null;
        mpRefreshToken: string | null;
        mpUserId: string | null;
        mpExpiresIn: number | null;
        mpTokenType: string | null;
        mpPublicKey: string | null;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
        requiresDeposit: boolean;
        depositType: import(".prisma/client").$Enums.DepositType;
        depositValue: import("@prisma/client/runtime/library").Decimal | null;
    })[]>;
    getProfessional(companyId: string, id: string): Promise<{
        services: ({
            service: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                description: string | null;
                durationMinutes: number;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string | null;
                imageUrl: string | null;
                sortOrder: number;
            };
        } & {
            professionalId: string;
            serviceId: string;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            customDuration: number | null;
        })[];
        availabilities: {
            id: string;
            isActive: boolean;
            companyId: string;
            professionalId: string | null;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            breakStart: string | null;
            breakEnd: string | null;
        }[];
        blockedTimes: {
            id: string;
            createdAt: Date;
            companyId: string;
            professionalId: string | null;
            startDateTime: Date;
            endDateTime: Date;
            reason: string | null;
        }[];
    } & {
        id: string;
        name: string;
        slug: string;
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        mpAccessToken: string | null;
        mpRefreshToken: string | null;
        mpUserId: string | null;
        mpExpiresIn: number | null;
        mpTokenType: string | null;
        mpPublicKey: string | null;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
        requiresDeposit: boolean;
        depositType: import(".prisma/client").$Enums.DepositType;
        depositValue: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    createProfessional(companyId: string, dto: CreateProfessionalDto): Promise<{
        id: string;
        name: string;
        slug: string;
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        mpAccessToken: string | null;
        mpRefreshToken: string | null;
        mpUserId: string | null;
        mpExpiresIn: number | null;
        mpTokenType: string | null;
        mpPublicKey: string | null;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
        requiresDeposit: boolean;
        depositType: import(".prisma/client").$Enums.DepositType;
        depositValue: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    updateProfessional(companyId: string, id: string, dto: UpdateProfessionalDto): Promise<{
        id: string;
        name: string;
        slug: string;
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        mpAccessToken: string | null;
        mpRefreshToken: string | null;
        mpUserId: string | null;
        mpExpiresIn: number | null;
        mpTokenType: string | null;
        mpPublicKey: string | null;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
        requiresDeposit: boolean;
        depositType: import(".prisma/client").$Enums.DepositType;
        depositValue: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    deleteProfessional(companyId: string, id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        mpAccessToken: string | null;
        mpRefreshToken: string | null;
        mpUserId: string | null;
        mpExpiresIn: number | null;
        mpTokenType: string | null;
        mpPublicKey: string | null;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
        requiresDeposit: boolean;
        depositType: import(".prisma/client").$Enums.DepositType;
        depositValue: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getPublicProfessional(companySlug: string, professionalSlug: string): Promise<{
        company: {
            id: string;
            name: string;
            slug: string;
            logoUrl: string | null;
            coverUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue;
        };
        services: ({
            service: {
                id: string;
                name: string;
                isActive: boolean;
                description: string | null;
                durationMinutes: number;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string | null;
                imageUrl: string | null;
            };
        } & {
            professionalId: string;
            serviceId: string;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            customDuration: number | null;
        })[];
    } & {
        id: string;
        name: string;
        slug: string;
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        mpAccessToken: string | null;
        mpRefreshToken: string | null;
        mpUserId: string | null;
        mpExpiresIn: number | null;
        mpTokenType: string | null;
        mpPublicKey: string | null;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
        requiresDeposit: boolean;
        depositType: import(".prisma/client").$Enums.DepositType;
        depositValue: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
