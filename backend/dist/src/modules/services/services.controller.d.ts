import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    listServices(req: any): Promise<({
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
    getService(req: any, id: string): Promise<{
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
    createService(req: any, dto: CreateServiceDto): Promise<{
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
    updateService(req: any, id: string, dto: UpdateServiceDto): Promise<{
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
    deleteService(req: any, id: string): Promise<{
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
