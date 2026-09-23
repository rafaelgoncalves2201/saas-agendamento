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
    // Normalizar telefone (ex: 5511999998888)
    let cleanPhone = input.toPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }

    const providerType = process.env.WHATSAPP_PROVIDER || (process.env.EVOLUTION_API_URL ? 'EVOLUTION' : 'META');

    // 1. PROVEDOR: EVOLUTION API (QR Code / Docker / Open Source)
    if (providerType === 'EVOLUTION' && process.env.EVOLUTION_API_URL && process.env.EVOLUTION_INSTANCE_NAME) {
      const evolutionUrl = process.env.EVOLUTION_API_URL.replace(/\/$/, '');
      const instanceName = process.env.EVOLUTION_INSTANCE_NAME;
      const apiKey = process.env.EVOLUTION_API_KEY || '';

      try {
        const url = `${evolutionUrl}/message/sendText/${instanceName}`;
        const res = await axios.post(
          url,
          {
            number: cleanPhone,
            text: input.text,
          },
          {
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );

        const messageId = res.data?.key?.id || res.data?.messageId || `evo.${Date.now()}`;
        this.logger.log(`✅ WhatsApp enviado com sucesso via Evolution API para ${cleanPhone} (ID: ${messageId})`);

        return {
          success: true,
          providerMessageId: messageId,
        };
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || err.response?.data?.error || err.message || 'Erro ao enviar via Evolution API';
        this.logger.error(`❌ Falha ao enviar WhatsApp via Evolution API para ${cleanPhone}: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }
    }

    // 2. PROVEDOR: Z-API (QR Code Gerenciado)
    if (providerType === 'ZAPI' && process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) {
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN || '';

      try {
        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
        const res = await axios.post(
          url,
          {
            phone: cleanPhone,
            message: input.text,
          },
          {
            headers: {
              ...(clientToken && { 'Client-Token': clientToken }),
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );

        const messageId = res.data?.zaapId || res.data?.messageId || `zapi.${Date.now()}`;
        this.logger.log(`✅ WhatsApp enviado com sucesso via Z-API para ${cleanPhone} (ID: ${messageId})`);

        return {
          success: true,
          providerMessageId: messageId,
        };
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Erro ao enviar via Z-API';
        this.logger.error(`❌ Falha ao enviar WhatsApp via Z-API para ${cleanPhone}: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }
    }

    // 3. PROVEDOR: META CLOUD API (Oficial WhatsApp Business)
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';

    if (phoneNumberId && accessToken) {
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
        this.logger.error(`❌ Falha ao enviar WhatsApp via Meta API para ${cleanPhone}: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }
    }

    // 4. MODO SIMULAÇÃO (Sem chaves configuradas)
    const mockMsgId = `wamid.mock.${Date.now()}`;
    this.logger.log(
      `[SIMULAÇÃO WHATSAPP] Mensagem para ${cleanPhone}: "${input.text || input.templateName}" (Mock ID: ${mockMsgId})`,
    );
    return {
      success: true,
      providerMessageId: mockMsgId,
    };
  }
}
