import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    listClients(req: any, search?: string): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        totalAppointments: number;
        lastAppointmentAt: Date | null;
    }[]>;
    getClient(req: any, id: string): Promise<{
        appointments: ({
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            durationMinutes: number;
            professionalId: string;
            serviceId: string;
            notes: string | null;
            mpPaymentId: string | null;
            clientManagementCode: string;
            clientId: string;
            startDateTime: Date;
            endDateTime: Date;
            priceAtBooking: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            couponCode: string | null;
            discountAmount: import("@prisma/client/runtime/library").Decimal | null;
            depositAmount: import("@prisma/client/runtime/library").Decimal | null;
            pixCopiaECola: string | null;
            pixQrCodeBase64: string | null;
            pixPaymentUrl: string | null;
            cardPaymentUrl: string | null;
            paidAt: Date | null;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            cancellationReason: string | null;
            cancelledAt: Date | null;
        })[];
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        totalAppointments: number;
        lastAppointmentAt: Date | null;
    }>;
    updateClient(req: any, id: string, dto: UpdateClientDto): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        totalAppointments: number;
        lastAppointmentAt: Date | null;
    }>;
}
