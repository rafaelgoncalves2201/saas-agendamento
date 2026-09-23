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
        companyId: string;
        description: string | null;
        durationMinutes: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        imageUrl: string | null;
        sortOrder: number;
    })[]>;
    getService(companyId: string, id: string): Promise<{
        professionals: ({
            professional: {
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
        companyId: string;
        description: string | null;
        durationMinutes: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        imageUrl: string | null;
        sortOrder: number;
    }>;
    createService(companyId: string, dto: CreateServiceDto): Promise<{
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
    }>;
    updateService(companyId: string, id: string, dto: UpdateServiceDto): Promise<{
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
    }>;
    deleteService(companyId: string, id: string): Promise<{
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
    }>;
}
