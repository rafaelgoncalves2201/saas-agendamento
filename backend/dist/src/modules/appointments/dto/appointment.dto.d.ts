import { AppointmentStatus } from '@prisma/client';
export declare class CreatePublicAppointmentDto {
    professionalId: string;
    serviceId: string;
    startDateTime: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    notes?: string;
    couponCode?: string;
}
export declare class UpdateAppointmentStatusDto {
    status: AppointmentStatus;
    cancellationReason?: string;
}
export declare class CancelAppointmentClientDto {
    reason?: string;
}
export declare class RescheduleAppointmentDto {
    startDateTime: string;
    professionalId?: string;
}
