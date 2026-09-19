import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface SendWhatsAppMessageInput {
  toPhone: string;
  templateName?: string;
  text?: string;
  parameters?: string[];
}

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  async sendMessage(input: SendWhatsAppMessageInput): Promise<{
    success: boolean;
    providerMessageId?: string;
    error?: string;
  }> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';

    // Normalizar telefone (ex: 5511999998888)
    let cleanPhone = input.toPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }

    // Modo simulação se chaves não estiverem configuradas
    if (!phoneNumberId || !accessToken) {
      const mockMsgId = `wamid.mock.${Date.now()}`;
      this.logger.log(
        `[SIMULAÇÃO WHATSAPP] Mensagem para ${cleanPhone}: "${input.text || input.templateName}" (Mock ID: ${mockMsgId})`,
      );
      return {
        success: true,
        providerMessageId: mockMsgId,
      };
    }

    // Chamada real para Meta Cloud API
    try {
      const url = `${apiUrl}/${phoneNumberId}/messages`;
      const body: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
      };

      if (input.templateName) {
        body.type = 'template';
        body.template = {
          name: input.templateName,
          language: { code: 'pt_BR' },
          components: input.parameters
            ? [
                {
                  type: 'body',
                  parameters: input.parameters.map((p) => ({
                    type: 'text',
                    text: p,
                  })),
                },
              ]
            : [],
        };
      } else {
        body.type = 'text';
        body.text = { preview_url: false, body: input.text };
      }

      const res = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const messageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      this.logger.log(`✅ WhatsApp enviado com sucesso via Meta API para ${cleanPhone} (ID: ${messageId})`);

      return {
        success: true,
        providerMessageId: messageId,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message || err.message || 'Erro desconhecido na Meta API';
      this.logger.error(`❌ Falha ao enviar WhatsApp para ${cleanPhone}: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}

