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
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';
        let cleanPhone = input.toPhone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('55')) {
            cleanPhone = `55${cleanPhone}`;
        }
        if (!phoneNumberId || !accessToken) {
            const mockMsgId = `wamid.mock.${Date.now()}`;
            this.logger.log(`[SIMULAÇÃO WHATSAPP] Mensagem para ${cleanPhone}: "${input.text || input.templateName}" (Mock ID: ${mockMsgId})`);
            return {
                success: true,
                providerMessageId: mockMsgId,
            };
        }
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
            this.logger.error(`❌ Falha ao enviar WhatsApp para ${cleanPhone}: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg,
            };
        }
    }
};
exports.WhatsAppProvider = WhatsAppProvider;
exports.WhatsAppProvider = WhatsAppProvider = WhatsAppProvider_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsAppProvider);
//# sourceMappingURL=whatsapp.provider.js.map