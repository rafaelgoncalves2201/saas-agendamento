import { PrismaService } from '../../database/prisma.service';
import { WhatsAppProvider } from './whatsapp.provider';
export declare class WhatsAppService {
    private prisma;
    private provider;
    private readonly logger;
    constructor(prisma: PrismaService, provider: WhatsAppProvider);
    sendAppointmentConfirmation(appointmentId: string): Promise<void>;
    sendCancellationNotification(appointmentId: string, reason?: string): Promise<void>;
    sendRescheduleNotification(appointmentId: string): Promise<void>;
}
