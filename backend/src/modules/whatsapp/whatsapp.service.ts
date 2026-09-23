import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppProvider } from './whatsapp.provider';
import { NotificationStatus } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private prisma: PrismaService,
    private provider: WhatsAppProvider,
  ) {}

  async sendAppointmentConfirmation(appointmentId: string) {
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

    if (!appointment) return;

    // 1. Validar se o plano da empresa tem notificações por WhatsApp habilitadas
    const features = (appointment.company.subscription?.plan?.features as Record<string, any>) || {};
    if (!features.whatsappNotifications) {
      this.logger.log(`WhatsApp desabilitado no plano da empresa ${appointment.company.name}`);
      return;
    }

    // 2. Validar limite de mensagens no mês
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

    const dateFormatted = format(appointment.startDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    // 3. Enviar mensagem para o CLIENTE
    const clientText = `Olá, *${appointment.client.name}*! 👋\n\nSeu agendamento em *${appointment.company.name}* foi confirmado com sucesso! ✅\n\n📌 *Serviço:* ${appointment.service.name}\n👤 *Profissional:* ${appointment.professional.name}\n🗓️ *Data e Horário:* ${dateFormatted}\n💰 *Valor:* R$ ${Number(appointment.priceAtBooking).toFixed(2)}\n\nCaso precise consultar ou cancelar, utilize seu link exclusivo de autoatendimento:\n${process.env.APP_URL || 'http://localhost:5173'}/agendamento/${appointment.clientManagementCode}\n\nTe esperamos! ✨`;

    const clientResult = await this.provider.sendMessage({
      toPhone: appointment.client.phone,
      text: clientText,
    });

    // Gravar log no banco
    await this.prisma.notificationLog.create({
      data: {
        companyId: appointment.companyId,
        appointmentId: appointment.id,
        channel: 'WHATSAPP',
        recipientPhone: appointment.client.phone,
        messageType: 'CONFIRMATION_CLIENT',
        status: clientResult.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        providerMessageId: clientResult.providerMessageId || null,
        errorPayload: clientResult.error || null,
        sentAt: clientResult.success ? new Date() : null,
      },
    });

    // 4. Enviar mensagem para o PROFISSIONAL
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
          status: profResult.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          providerMessageId: profResult.providerMessageId || null,
          errorPayload: profResult.error || null,
          sentAt: profResult.success ? new Date() : null,
        },
      });
    }
  }

  async sendCancellationNotification(appointmentId: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        company: true,
        professional: true,
        service: true,
        client: true,
      },
    });

    if (!appointment) return;

    const dateFormatted = format(appointment.startDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

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
        status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        providerMessageId: result.providerMessageId || null,
        errorPayload: result.error || null,
        sentAt: result.success ? new Date() : null,
      },
    });
  }

  async sendRescheduleNotification(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        company: true,
        professional: true,
        service: true,
        client: true,
      },
    });

    if (!appointment) return;

    const dateFormatted = format(appointment.startDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

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
        status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        providerMessageId: result.providerMessageId || null,
        errorPayload: result.error || null,
        sentAt: result.success ? new Date() : null,
      },
    });
  }
}


