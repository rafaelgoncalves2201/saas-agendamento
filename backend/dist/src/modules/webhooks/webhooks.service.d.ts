import { PrismaService } from '../../database/prisma.service';
export declare class WebhooksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processAsaasWebhook(tokenHeader: string | undefined, payload: any): Promise<{
        received: boolean;
        status: string;
    }>;
}
