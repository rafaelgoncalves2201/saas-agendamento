"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const whatsapp_provider_1 = require("./whatsapp.provider");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    prisma;
    provider;
    logger = new common_1.Logger(WhatsAppService_1.name);
    constructor(prisma, provider) {
        this.prisma = prisma;
        this.provider = provider;
    }
    async sendAppointmentConfirmation(appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                company: {
                    include: {
                        subscription: {
                            include: { plan: true },
                        },
                    },
                },
                professional: true,
                service: true,
                client: true,
            },
        });
        if (!appointment)
            return;
        const features = appointment.company.subscription?.plan?.features || {};
        if (!features.whatsappNotifications) {
            this.logger.log(`WhatsApp desabilitado no plano da empresa ${appointment.company.name}`);
            return;
        }
        const maxMessages = appointment.company.subscription?.plan?.maxWhatsappMessages || 0;
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const sentCount = await this.prisma.notificationLog.count({
            where: {
                companyId: appointment.companyId,
                channel: 'WHATSAPP',
                status: 'SENT',
                createdAt: { gte: startOfMonth },
            },
        });
        if (sentCount >= maxMessages) {
            this.logger.warn(`Limite de mensagens de WhatsApp atingido no mês (${sentCount}/${maxMessages})`);
            return;
        }
        const dateFormatted = (0, date_fns_1.format)(appointment.startDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: locale_1.ptBR });
        const clientText = `Olá, *${appointment.client.name}*! 👋\n\nSeu agendamento em *${appointment.company.name}* foi confirmado com sucesso! ✅\n\n📌 *Serviço:* ${appointment.service.name}\n👤 *Profissional:* ${appointment.professional.name}\n🗓️ *Data e Horário:* ${dateFormatted}\n💰 *Valor:* R$ ${Number(appointment.priceAtBooking).toFixed(2)}\n\nCaso precise consultar ou cancelar, utilize seu link exclusivo de autoatendimento:\n${process.env.APP_URL || 'http://localhost:5173'}/agendamento/${appointment.clientManagementCode}\n\nTe esperamos! ✨`;
        const clientResult = await this.provider.sendMessage({
            toPhone: appointment.client.phone,
            text: clientText,
        });
        await this.prisma.notificationLog.create({
            data: {
                companyId: appointment.companyId,
                appointmentId: appointment.id,
                channel: 'WHATSAPP',
                recipientPhone: appointment.client.phone,
                messageType: 'CONFIRMATION_CLIENT',
                status: clientResult.success ? client_1.NotificationStatus.SENT : client_1.NotificationStatus.FAILED,
                providerMessageId: clientResult.providerMessageId || null,
                errorPayload: clientResult.error || null,
                sentAt: clientResult.success ? new Date() : null,
            },
        });
        if (appointment.professional.phone) {
            const profText = `🔔 *Novo Agendamento!*\n\nOlá, *${appointment.professional.name}*, um novo atendimento foi marcado:\n\n👤 *Cliente:* ${appointment.client.name}\n📱 *WhatsApp:* ${appointment.client.phone}\n📌 *Serviço:* ${appointment.service.name}\n🗓️ *Horário:* ${dateFormatted}\n\nAcesse seu painel para ver sua agenda completa!`;
            const profResult = await this.provider.sendMessage({
                toPhone: appointment.professional.phone,
                text: profText,
            });
            await this.prisma.notificationLog.create({
                data: {
                    companyId: appointment.companyId,
                    appointmentId: appointment.id,
                    channel: 'WHATSAPP',
                    recipientPhone: appointment.professional.phone,
                    messageType: 'NEW_BOOKING_PROFESSIONAL',
                    status: profResult.success ? client_1.NotificationStatus.SENT : client_1.NotificationStatus.FAILED,
                    providerMessageId: profResult.providerMessageId || null,
                    errorPayload: profResult.error || null,
                    sentAt: profResult.success ? new Date() : null,
                },
            });
        }
    }
    async sendCancellationNotification(appointmentId, reason) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                company: true,
                professional: true,
                service: true,
                client: true,
            },
        });
        if (!appointment)
            return;
        const dateFormatted = (0, date_fns_1.format)(appointment.startDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: locale_1.ptBR });
        const text = `Olá, *${appointment.client.name}*. Seu agendamento de *${appointment.service.name}* com *${appointment.professional.name}* para *${dateFormatted}* foi *cancelado*.\n\n${reason ? `Motivo: ${reason}\n\n` : ''}Caso queira reagendar um novo horário, acesse:\n${process.env.APP_URL || 'http://localhost:5173'}/empresa/${appointment.company.slug}`;
        const result = await this.provider.sendMessage({
            toPhone: appointment.client.phone,
            text,
        });
        await this.prisma.notificationLog.create({
            data: {
                companyId: appointment.companyId,
                appointmentId: appointment.id,
                channel: 'WHATSAPP',
                recipientPhone: appointment.client.phone,
                messageType: 'CANCELLATION',
                status: result.success ? client_1.NotificationStatus.SENT : client_1.NotificationStatus.FAILED,
                providerMessageId: result.providerMessageId || null,
                errorPayload: result.error || null,
                sentAt: result.success ? new Date() : null,
            },
        });
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_provider_1.WhatsAppProvider])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map