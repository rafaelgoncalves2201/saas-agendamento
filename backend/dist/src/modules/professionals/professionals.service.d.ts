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
                description: string | null;
                sortOrder: number;
                companyId: string;
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
        availabilities: {
            id: string;
            isActive: boolean;
            companyId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            breakStart: string | null;
            breakEnd: string | null;
            professionalId: string | null;
        }[];
        _count: {
            appointments: number;
        };
    } & {
        id: string;
        email: string | null;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
    })[]>;
    getProfessional(companyId: string, id: string): Promise<{
        services: ({
            service: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                sortOrder: number;
                companyId: string;
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
        availabilities: {
            id: string;
            isActive: boolean;
            companyId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            breakStart: string | null;
            breakEnd: string | null;
            professionalId: string | null;
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
        email: string | null;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    createProfessional(companyId: string, dto: CreateProfessionalDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    updateProfessional(companyId: string, id: string, dto: UpdateProfessionalDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    deleteProfessional(companyId: string, id: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
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
        email: string | null;
        name: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        companyId: string;
        userId: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
}
