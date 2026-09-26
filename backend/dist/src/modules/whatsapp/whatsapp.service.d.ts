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
    sendLowStockAlert(companyId: string, productId: string, currentStock: number, minStock: number, unit: string): Promise<{
        success: boolean;
        sentCount: number;
        message?: undefined;
        totalProfessionals?: undefined;
    } | {
        success: boolean;
        sentCount: number;
        message: string;
        totalProfessionals?: undefined;
    } | {
        success: boolean;
        sentCount: number;
        totalProfessionals: number;
        message?: undefined;
    }>;
    sendBulkLowStockAlert(companyId: string, items: Array<{
        id: string;
        name: string;
        stock: number;
        minStock: number;
        unit: string;
        sku?: string | null;
    }>): Promise<{
        success: boolean;
        sentCount: number;
        message?: undefined;
        totalProfessionals?: undefined;
    } | {
        success: boolean;
        sentCount: number;
        message: string;
        totalProfessionals?: undefined;
    } | {
        success: boolean;
        sentCount: number;
        totalProfessionals: number;
        message?: undefined;
    }>;
}
