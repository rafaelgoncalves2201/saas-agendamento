import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
export declare class ServicesService {
    private prisma;
    constructor(prisma: PrismaService);
    listServices(companyId: string): Promise<({
        professionals: ({
            professional: {
                id: string;
                name: string;
                slug: string;
                avatarUrl: string | null;
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
    })[]>;
    getService(companyId: string, id: string): Promise<{
        professionals: ({
            professional: {
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
    }>;
    createService(companyId: string, dto: CreateServiceDto): Promise<{
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
    }>;
    updateService(companyId: string, id: string, dto: UpdateServiceDto): Promise<{
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
    }>;
    deleteService(companyId: string, id: string): Promise<{
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
    }>;
}
