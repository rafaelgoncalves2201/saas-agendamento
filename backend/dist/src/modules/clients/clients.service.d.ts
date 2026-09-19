import { PrismaService } from '../../database/prisma.service';
import { UpdateClientDto } from './dto/update-client.dto';
export declare class ClientsService {
    private prisma;
    constructor(prisma: PrismaService);
    listClients(companyId: string, search?: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        totalAppointments: number;
        lastAppointmentAt: Date | null;
    }[]>;
    getClient(companyId: string, id: string): Promise<{
        appointments: ({
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            professionalId: string;
            durationMinutes: number;
            serviceId: string;
            startDateTime: Date;
            endDateTime: Date;
            clientId: string;
            priceAtBooking: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            couponCode: string | null;
            discountAmount: import("@prisma/client/runtime/library").Decimal | null;
            clientManagementCode: string;
            notes: string | null;
            cancellationReason: string | null;
            cancelledAt: Date | null;
        })[];
    } & {
        id: string;
        email: string | null;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        totalAppointments: number;
        lastAppointmentAt: Date | null;
    }>;
    updateClient(companyId: string, id: string, dto: UpdateClientDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        totalAppointments: number;
        lastAppointmentAt: Date | null;
    }>;
}
