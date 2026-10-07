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

    // Todos os planos possuem notificações por WhatsApp ativas e sem limite de envios
    this.logger.log(
      `Disparando notificações de WhatsApp para agendamento ${appointmentId} (Empresa: ${appointment.company.name}) - Sem limites de plano`,
    );

    const dateFormatted = format(appointment.startDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    const companySettings = (appointment.company.settings as Record<string, any>) || {};
    const address = (appointment.professional as any)?.address || companySettings.address;
    const addressLine = address ? `📍 *Endereço:* ${address}\n` : '';

    // 3. Enviar mensagem para o CLIENTE
    const clientText = `Olá, *${appointment.client.name}*! 👋\n\nSeu agendamento em *${appointment.company.name}* foi confirmado com sucesso! ✅\n\n📌 *Serviço:* ${appointment.service.name}\n👤 *Profissional:* ${appointment.professional.name}\n🗓️ *Data e Horário:* ${dateFormatted}\n${addressLine}💰 *Valor:* R$ ${Number(appointment.priceAtBooking).toFixed(2)}\n\nCaso precise consultar ou cancelar, utilize seu link exclusivo de autoatendimento:\n${process.env.APP_URL || 'https://saas-agendamento-f3jo.onrender.com'}/agendamento/${appointment.clientManagementCode}\n\nTe esperamos! ✨`;

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

    const hasRefund = reason?.includes('Estorno') || appointment.cancellationReason?.includes('Estorno');
    const refundNotice = hasRefund
      ? '\n💳 *Reembolso / Estorno:* O valor pago foi estornado integralmente para a mesma forma de pagamento utilizada (Pix ou Cartão de Crédito).\n'
      : '';

    const text = `Olá, *${appointment.client.name}*. Seu agendamento de *${appointment.service.name}* com *${appointment.professional.name}* para *${dateFormatted}* foi *cancelado*.\n\n${reason ? `Motivo: ${reason}\n` : ''}${refundNotice}\nCaso queira reagendar um novo horário, acesse:\n${process.env.APP_URL || 'https://saas-agendamento-f3jo.onrender.com'}/empresa/${appointment.company.slug}`;

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

    // 2. Enviar notificação de cancelamento para o PROFISSIONAL (ou fallback para telefone da Empresa)
    const profPhone = appointment.professional?.phone || appointment.company?.phone;
    if (profPhone) {
      const isClientAction = reason?.toLowerCase().includes('cliente') || reason?.toLowerCase().includes('autoatendimento');
      const originNotice = isClientAction
        ? '👤 *Cancelado por:* Cliente (autoatendimento online)\n'
        : '🏢 *Cancelado por:* Estabelecimento / Painel\n';

      const profText = `⚠️ *Agendamento Cancelado!*\n\nOlá, *${appointment.professional?.name || appointment.company.name}*, informamos que um agendamento na sua agenda foi cancelado:\n\n${originNotice}👤 *Cliente:* ${appointment.client.name}\n📌 *Serviço:* ${appointment.service.name}\n🗓️ *Horário:* ${dateFormatted}\n${reason ? `📝 *Motivo:* ${reason}\n` : ''}\nEsse horário já foi liberado na sua agenda para novos atendimentos.`;

      const profResult = await this.provider.sendMessage({
        toPhone: profPhone,
        text: profText,
      });

      await this.prisma.notificationLog.create({
        data: {
          companyId: appointment.companyId,
          appointmentId: appointment.id,
          channel: 'WHATSAPP',
          recipientPhone: profPhone,
          messageType: 'CANCELLATION_PROFESSIONAL',
          status: profResult.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          providerMessageId: profResult.providerMessageId || null,
          errorPayload: profResult.error || null,
          sentAt: profResult.success ? new Date() : null,
        },
      });
    }
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

    const companySettings = (appointment.company.settings as Record<string, any>) || {};
    const address = (appointment.professional as any)?.address || companySettings.address;
    const addressLine = address ? `📍 *Endereço:* ${address}\n` : '';

    const text = `Olá, *${appointment.client.name}*! 👋\n\nSeu agendamento em *${appointment.company.name}* foi *reagendado* com sucesso!\n\n📌 *Serviço:* ${appointment.service.name}\n👤 *Profissional:* ${appointment.professional.name}\n🗓️ *Novo Horário:* ${dateFormatted}\n${addressLine}\nVocê pode consultar seus detalhes a qualquer momento em:\n${process.env.APP_URL || 'https://saas-agendamento-f3jo.onrender.com'}/agendamento/${appointment.clientManagementCode}\n\nTe esperamos! ✨`;

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

    // Enviar notificação de reagendamento para o PROFISSIONAL
    if (appointment.professional?.phone) {
      const profText = `🔄 *Agendamento Reagendado!*\n\nOlá, *${appointment.professional.name}*, um atendimento foi reagendado:\n\n👤 *Cliente:* ${appointment.client.name}\n📌 *Serviço:* ${appointment.service.name}\n🗓️ *Novo Horário:* ${dateFormatted}\n\nConsulte sua agenda atualizada no painel!`;

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
          messageType: 'RESCHEDULE_PROFESSIONAL',
          status: profResult.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          providerMessageId: profResult.providerMessageId || null,
          errorPayload: profResult.error || null,
          sentAt: profResult.success ? new Date() : null,
        },
      });
    }
  }

  /**
   * Envia alerta individual de reposição de estoque para todos os profissionais ativos da empresa
   */
  async sendLowStockAlert(
    companyId: string,
    productId: string,
    currentStock: number,
    minStock: number,
    unit: string,
  ) {
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
      this.logger.warn(
        `[sendLowStockAlert] Empresa ou produto não encontrado (companyId=${companyId}, productId=${productId})`,
      );
      return { success: false, sentCount: 0 };
    }

    const validProfessionals = professionals.filter(
      (p) => p.phone && p.phone.replace(/\D/g, '').length >= 10,
    );

    if (validProfessionals.length === 0) {
      this.logger.warn(
        `[sendLowStockAlert] Nenhum profissional ativo com telefone cadastrado para a empresa ${company.name}`,
      );
      return { success: false, sentCount: 0, message: 'Nenhum profissional com telefone válido cadastrado.' };
    }

    const unitStr = unit || product.unit || 'un';
    const skuNotice = product.sku ? `\n🔢 *SKU:* \`${product.sku}\`` : '';

    let sentCount = 0;

    for (const prof of validProfessionals) {
      const text =
        `⚠️ *ALERTA DE REPOSIÇÃO DE ESTOQUE* 📦\n\n` +
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
            status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
            providerMessageId: result.providerMessageId || null,
            errorPayload: result.error || null,
            sentAt: result.success ? new Date() : null,
          },
        });

        if (result.success) {
          sentCount++;
        }
      } catch (err: any) {
        this.logger.error(`Erro ao enviar alerta de estoque para ${prof.name} (${prof.phone}):`, err);
      }
    }

    this.logger.log(
      `Alerta de estoque baixo para o produto "${product.name}" enviado para ${sentCount}/${validProfessionals.length} profissionais`,
    );

    return { success: true, sentCount, totalProfessionals: validProfessionals.length };
  }

  /**
   * Envia alerta consolidado de todos os produtos com estoque baixo para os profissionais ativos
   */
  async sendBulkLowStockAlert(
    companyId: string,
    items: Array<{ id: string; name: string; stock: number; minStock: number; unit: string; sku?: string | null }>,
  ) {
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

    if (!company) return { success: false, sentCount: 0 };

    const validProfessionals = professionals.filter(
      (p) => p.phone && p.phone.replace(/\D/g, '').length >= 10,
    );

    if (validProfessionals.length === 0) {
      return { success: false, sentCount: 0, message: 'Nenhum profissional ativo com telefone cadastrado.' };
    }

    const itemsList = items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.name}*: *${it.stock} ${it.unit || 'un'}* (Mín: ${it.minStock} ${it.unit || 'un'})`,
      )
      .join('\n');

    let sentCount = 0;

    for (const prof of validProfessionals) {
      const text =
        `⚠️ *AVISO DE REPOSIÇÃO DE ESTOQUE* 📦\n\n` +
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
            status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
            providerMessageId: result.providerMessageId || null,
            errorPayload: result.error || null,
            sentAt: result.success ? new Date() : null,
          },
        });

        if (result.success) sentCount++;
      } catch (err: any) {
        this.logger.error(`Erro ao enviar alerta consolidado para ${prof.name}:`, err);
      }
    }

    return { success: true, sentCount, totalProfessionals: validProfessionals.length };
  }
}


