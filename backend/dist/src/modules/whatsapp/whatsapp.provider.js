"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WhatsAppProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let WhatsAppProvider = WhatsAppProvider_1 = class WhatsAppProvider {
    logger = new common_1.Logger(WhatsAppProvider_1.name);
    async sendMessage(input) {
        let cleanPhone = input.toPhone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('55')) {
            cleanPhone = `55${cleanPhone}`;
        }
        const providerType = process.env.WHATSAPP_PROVIDER || (process.env.EVOLUTION_API_URL ? 'EVOLUTION' : 'META');
        if (providerType === 'EVOLUTION' && process.env.EVOLUTION_API_URL && process.env.EVOLUTION_INSTANCE_NAME) {
            const evolutionUrl = process.env.EVOLUTION_API_URL.replace(/\/$/, '');
            const instanceName = process.env.EVOLUTION_INSTANCE_NAME;
            const apiKey = process.env.EVOLUTION_API_KEY || '';
            try {
                const url = `${evolutionUrl}/message/sendText/${instanceName}`;
                const res = await axios_1.default.post(url, {
                    number: cleanPhone,
                    text: input.text,
                }, {
                    headers: {
                        apikey: apiKey,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                });
                const messageId = res.data?.key?.id || res.data?.messageId || `evo.${Date.now()}`;
                this.logger.log(`✅ WhatsApp enviado com sucesso via Evolution API para ${cleanPhone} (ID: ${messageId})`);
                return {
                    success: true,
                    providerMessageId: messageId,
                };
            }
            catch (err) {
                const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Erro ao enviar via Evolution API';
                this.logger.error(`❌ Falha ao enviar WhatsApp via Evolution API para ${cleanPhone}: ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg,
                };
            }
        }
        if (providerType === 'ZAPI' && process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) {
            const instanceId = process.env.ZAPI_INSTANCE_ID;
            const token = process.env.ZAPI_TOKEN;
            const clientToken = process.env.ZAPI_CLIENT_TOKEN || '';
            try {
                const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
                const res = await axios_1.default.post(url, {
                    phone: cleanPhone,
                    message: input.text,
                }, {
                    headers: {
                        ...(clientToken && { 'Client-Token': clientToken }),
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                });
                const messageId = res.data?.zaapId || res.data?.messageId || `zapi.${Date.now()}`;
                this.logger.log(`✅ WhatsApp enviado com sucesso via Z-API para ${cleanPhone} (ID: ${messageId})`);
                return {
                    success: true,
                    providerMessageId: messageId,
                };
            }
            catch (err) {
                const errorMsg = err.response?.data?.message || err.message || 'Erro ao enviar via Z-API';
                this.logger.error(`❌ Falha ao enviar WhatsApp via Z-API para ${cleanPhone}: ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg,
                };
            }
        }
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';
        if (phoneNumberId && accessToken) {
            try {
                const url = `${apiUrl}/${phoneNumberId}/messages`;
                const body = {
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
                }
                else {
                    body.type = 'text';
                    body.text = { preview_url: false, body: input.text };
                }
                const res = await axios_1.default.post(url, body, {
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
            }
            catch (err) {
                const errorMsg = err.response?.data?.error?.message || err.message || 'Erro desconhecido na Meta API';
                this.logger.error(`❌ Falha ao enviar WhatsApp via Meta API para ${cleanPhone}: ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg,
                };
            }
        }
        const mockMsgId = `wamid.mock.${Date.now()}`;
        this.logger.log(`[SIMULAÇÃO WHATSAPP] Mensagem para ${cleanPhone}: "${input.text || input.templateName}" (Mock ID: ${mockMsgId})`);
        return {
            success: true,
            providerMessageId: mockMsgId,
        };
    }
};
exports.WhatsAppProvider = WhatsAppProvider;
exports.WhatsAppProvider = WhatsAppProvider = WhatsAppProvider_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsAppProvider);
//# sourceMappingURL=whatsapp.provider.js.map