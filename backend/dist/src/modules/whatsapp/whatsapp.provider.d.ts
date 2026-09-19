export interface SendWhatsAppMessageInput {
    toPhone: string;
    templateName?: string;
    text?: string;
    parameters?: string[];
}
export declare class WhatsAppProvider {
    private readonly logger;
    sendMessage(input: SendWhatsAppMessageInput): Promise<{
        success: boolean;
        providerMessageId?: string;
        error?: string;
    }>;
}
