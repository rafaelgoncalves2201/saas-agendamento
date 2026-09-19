import { AppointmentsService } from './appointments.service';
import { CancelAppointmentClientDto, CreatePublicAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { AppointmentStatus } from '@prisma/client';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    createPublicAppointment(slug: string, dto: CreatePublicAppointmentDto): Promise<{
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
                settings: import("@prisma/client/runtime/library").JsonValue;
            };
            service: {
                name: string;
                durationMinutes: number;
                price: import("@prisma/client/runtime/library").Decimal;
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
            priceAtBooking: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            couponCode: string | null;
            discountAmount: import("@prisma/client/runtime/library").Decimal | null;
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
    getPublicAppointment(code: string): Promise<{
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
            settings: import("@prisma/client/runtime/library").JsonValue;
        };
        service: {
            name: string;
            durationMinutes: number;
            price: import("@prisma/client/runtime/library").Decimal;
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
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        couponCode: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    }>;
    cancelPublicAppointment(code: string, dto: CancelAppointmentClientDto): Promise<{
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
    }>;
    listAppointments(req: any, professionalId?: string, status?: AppointmentStatus, startDate?: string, endDate?: string): Promise<({
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
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        couponCode: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    })[]>;
    updateStatus(req: any, id: string, dto: UpdateAppointmentStatusDto): Promise<{
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
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        couponCode: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        clientManagementCode: string;
        notes: string | null;
        cancellationReason: string | null;
        cancelledAt: Date | null;
    }>;
    deleteAppointment(req: any, id: string): Promise<{
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
    }>;
}
