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
        this.logger.log(`Disparando notificações de WhatsApp para agendamento ${appointmentId} (Empresa: ${appointment.company.name}) - Sem limites de plano`);
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
        const hasRefund = reason?.includes('Estorno') || appointment.cancellationReason?.includes('Estorno');
        const refundNotice = hasRefund
            ? '\n💳 *Reembolso / Estorno:* O valor pago foi estornado integralmente para a mesma forma de pagamento utilizada (Pix ou Cartão de Crédito).\n'
            : '';
        const text = `Olá, *${appointment.client.name}*. Seu agendamento de *${appointment.service.name}* com *${appointment.professional.name}* para *${dateFormatted}* foi *cancelado*.\n\n${reason ? `Motivo: ${reason}\n` : ''}${refundNotice}\nCaso queira reagendar um novo horário, acesse:\n${process.env.APP_URL || 'http://localhost:5173'}/empresa/${appointment.company.slug}`;
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
    async sendRescheduleNotification(appointmentId) {
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
        const text = `Olá, *${appointment.client.name}*! 👋\n\nSeu agendamento em *${appointment.company.name}* foi *reagendado* com sucesso!\n\n📌 *Serviço:* ${appointment.service.name}\n👤 *Profissional:* ${appointment.professional.name}\n🗓️ *Novo Horário:* ${dateFormatted}\n\nVocê pode consultar seus detalhes a qualquer momento em:\n${process.env.APP_URL || 'http://localhost:5173'}/agendamento/${appointment.clientManagementCode}\n\nTe esperamos! ✨`;
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
                messageType: 'RESCHEDULE',
                status: result.success ? client_1.NotificationStatus.SENT : client_1.NotificationStatus.FAILED,
                providerMessageId: result.providerMessageId || null,
                errorPayload: result.error || null,
                sentAt: result.success ? new Date() : null,
            },
        });
    }
    async sendLowStockAlert(companyId, productId, currentStock, minStock, unit) {
        const [company, product, professionals] = await Promise.all([
            this.prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, phone: true },
            }),
            this.prisma.product.findUnique({
                where: { id: productId },
                select: { id: true, name: true, sku: true, type: true, stock: true, minStock: true, unit: true },
            }),
            this.prisma.professional.findMany({
                where: { companyId, isActive: true },
                select: { id: true, name: true, phone: true },
            }),
        ]);
        if (!company || !product) {
            this.logger.warn(`[sendLowStockAlert] Empresa ou produto não encontrado (companyId=${companyId}, productId=${productId})`);
            return { success: false, sentCount: 0 };
        }
        const validProfessionals = professionals.filter((p) => p.phone && p.phone.replace(/\D/g, '').length >= 10);
        if (validProfessionals.length === 0) {
            this.logger.warn(`[sendLowStockAlert] Nenhum profissional ativo com telefone cadastrado para a empresa ${company.name}`);
            return { success: false, sentCount: 0, message: 'Nenhum profissional com telefone válido cadastrado.' };
        }
        const unitStr = unit || product.unit || 'un';
        const skuNotice = product.sku ? `\n🔢 *SKU:* \`${product.sku}\`` : '';
        let sentCount = 0;
        for (const prof of validProfessionals) {
            const text = `⚠️ *ALERTA DE REPOSIÇÃO DE ESTOQUE* 📦\n\n` +
                `Olá, *${prof.name}*!\n` +
                `O item abaixo atingiu o nível crítico de estoque em *${company.name}*:\n\n` +
                `🏷️ *Item / Insumo:* ${product.name}\n` +
                `📉 *Saldo Atual:* *${currentStock} ${unitStr}*\n` +
                `🛑 *Estoque Mínimo:* ${minStock} ${unitStr}` +
                skuNotice +
                `\n\nPor favor, providencie a reposição para evitar a falta do material durante os atendimentos! ✨`;
            try {
                const result = await this.provider.sendMessage({
                    toPhone: prof.phone,
                    text,
                });
                await this.prisma.notificationLog.create({
                    data: {
                        companyId,
                        channel: 'WHATSAPP',
                        recipientPhone: prof.phone,
                        messageType: 'LOW_STOCK',
                        status: result.success ? client_1.NotificationStatus.SENT : client_1.NotificationStatus.FAILED,
                        providerMessageId: result.providerMessageId || null,
                        errorPayload: result.error || null,
                        sentAt: result.success ? new Date() : null,
                    },
                });
                if (result.success) {
                    sentCount++;
                }
            }
            catch (err) {
                this.logger.error(`Erro ao enviar alerta de estoque para ${prof.name} (${prof.phone}):`, err);
            }
        }
        this.logger.log(`Alerta de estoque baixo para o produto "${product.name}" enviado para ${sentCount}/${validProfessionals.length} profissionais`);
        return { success: true, sentCount, totalProfessionals: validProfessionals.length };
    }
    async sendBulkLowStockAlert(companyId, items) {
        const [company, professionals] = await Promise.all([
            this.prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true },
            }),
            this.prisma.professional.findMany({
                where: { companyId, isActive: true },
                select: { id: true, name: true, phone: true },
            }),
        ]);
        if (!company)
            return { success: false, sentCount: 0 };
        const validProfessionals = professionals.filter((p) => p.phone && p.phone.replace(/\D/g, '').length >= 10);
        if (validProfessionals.length === 0) {
            return { success: false, sentCount: 0, message: 'Nenhum profissional ativo com telefone cadastrado.' };
        }
        const itemsList = items
            .map((it, idx) => `${idx + 1}. *${it.name}*: *${it.stock} ${it.unit || 'un'}* (Mín: ${it.minStock} ${it.unit || 'un'})`)
            .join('\n');
        let sentCount = 0;
        for (const prof of validProfessionals) {
            const text = `⚠️ *AVISO DE REPOSIÇÃO DE ESTOQUE* 📦\n\n` +
                `Olá, *${prof.name}*!\n` +
                `Constatamos que os seguintes itens estão com estoque crítico em *${company.name}*:\n\n` +
                itemsList +
                `\n\nPor favor, providenciem a reposição para manter os atendimentos sem imprevistos! ✨`;
            try {
                const result = await this.provider.sendMessage({
                    toPhone: prof.phone,
                    text,
                });
                await this.prisma.notificationLog.create({
                    data: {
                        companyId,
                        channel: 'WHATSAPP',
                        recipientPhone: prof.phone,
                        messageType: 'BULK_LOW_STOCK',
                        status: result.success ? client_1.NotificationStatus.SENT : client_1.NotificationStatus.FAILED,
                        providerMessageId: result.providerMessageId || null,
                        errorPayload: result.error || null,
                        sentAt: result.success ? new Date() : null,
                    },
                });
                if (result.success)
                    sentCount++;
            }
            catch (err) {
                this.logger.error(`Erro ao enviar alerta consolidado para ${prof.name}:`, err);
            }
        }
        return { success: true, sentCount, totalProfessionals: validProfessionals.length };
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_provider_1.WhatsAppProvider])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map