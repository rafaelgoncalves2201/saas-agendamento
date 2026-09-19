import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CancelAppointmentClientDto, CreatePublicAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { AppointmentStatus, Prisma } from '@prisma/client';
export declare class AppointmentsService {
    private prisma;
    private whatsAppService;
    constructor(prisma: PrismaService, whatsAppService: WhatsAppService);
    createPublicAppointment(companySlug: string, dto: CreatePublicAppointmentDto): Promise<{
        success: boolean;
        message: string;
        appointment: {
            professional: {
                name: string;
                phone: string;
                avatarUrl: string | null;
            };
            company: {
                name: string;
                phone: string;
                slug: string;
                logoUrl: string | null;
                settings: Prisma.JsonValue;
            };
            service: {
                name: string;
                durationMinutes: number;
                price: Prisma.Decimal;
                imageUrl: string | null;
            };
            client: {
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
            priceAtBooking: Prisma.Decimal;
            originalPrice: Prisma.Decimal | null;
            couponCode: string | null;
            discountAmount: Prisma.Decimal | null;
            clientManagementCode: string;
            notes: string | null;
            cancellationReason: string | null;
            cancelledAt: Date | null;
        };
        requiresDeposit: boolean;
        depositInfo: {
            depositValue: any;
            pixKey: any;
            pixKeyType: any;
            pixRecipientName: any;
            depositInstructions: any;
            companyPhone: string;
        } | null;
        clientManagementUrl: string;
    }>;
    getAppointmentByManagementCode(code: string): Promise<{
        professional: {
            name: string;
            phone: string;
            avatarUrl: string | null;
        };
        company: {
            name: string;
            phone: string;
            slug: string;
            logoUrl: string | null;
            settings: Prisma.JsonValue;
        };
        service: {
            name: string;
            durationMinutes: number;
            price: Prisma.Decimal;
        };
        client: {
            name: string;
            phone: string;
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
        priceAtBooking: Prisma.Decimal;
        originalPrice: Prisma.Decimal | null;
        couponCode: string | null;
        discountAmount: Prisma.Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    }>;
    cancelByManagementCode(code: string, dto: CancelAppointmentClientDto): Promise<{
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
        priceAtBooking: Prisma.Decimal;
        originalPrice: Prisma.Decimal | null;
        couponCode: string | null;
        discountAmount: Prisma.Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    }>;
    listAppointments(companyId: string, filters?: {
        professionalId?: string;
        status?: AppointmentStatus;
        startDate?: string;
        endDate?: string;
    }): Promise<({
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
            price: Prisma.Decimal;
            category: string | null;
            imageUrl: string | null;
        };
        client: {
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
        priceAtBooking: Prisma.Decimal;
        originalPrice: Prisma.Decimal | null;
        couponCode: string | null;
        discountAmount: Prisma.Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    })[]>;
    updateAppointmentStatus(companyId: string, id: string, dto: UpdateAppointmentStatusDto): Promise<{
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
            price: Prisma.Decimal;
            category: string | null;
            imageUrl: string | null;
        };
        client: {
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
        priceAtBooking: Prisma.Decimal;
        originalPrice: Prisma.Decimal | null;
        couponCode: string | null;
        discountAmount: Prisma.Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    }>;
    deleteAppointment(companyId: string, id: string): Promise<{
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
        priceAtBooking: Prisma.Decimal;
        originalPrice: Prisma.Decimal | null;
        couponCode: string | null;
        discountAmount: Prisma.Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    }>;
}
