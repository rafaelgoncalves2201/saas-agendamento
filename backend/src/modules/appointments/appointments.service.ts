import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import {
  CancelAppointmentClientDto,
  CreatePublicAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointment.dto';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { addMinutes, differenceInHours, isBefore } from 'date-fns';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {}

  // =========================================================================
  // AGENDAMENTO PÚBLICO (CLIENTE FINAL SEM LOGIN)
  // =========================================================================
  async createPublicAppointment(companySlug: string, dto: CreatePublicAppointmentDto) {
    // 1. Localizar Empresa
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException('Empresa não encontrada ou inativa');
    }

    // 2. Verificar limite de agendamentos no mês da empresa
    const maxAppointments = company.subscription?.plan?.maxAppointmentsPerMonth || 100;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthAppointments = await this.prisma.appointment.count({
      where: {
        companyId: company.id,
        createdAt: { gte: startOfMonth },
        status: { not: AppointmentStatus.CANCELLED },
      },
    });

    if (currentMonthAppointments >= maxAppointments) {
      throw new ForbiddenException(
        'O estabelecimento atingiu o limite de agendamentos mensais. Entre em contato diretamente pelo WhatsApp.',
      );
    }

    // 3. Validar Serviço
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, companyId: company.id, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado ou inativo');
    }

    // 4. Validar Profissional
    const professional = await this.prisma.professional.findFirst({
      where: { id: dto.professionalId, companyId: company.id, isActive: true },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado ou inativo');
    }

    // 4.1 Verificar limite de agendamentos mensais por profissional do plano
    const planSlug = company.subscription?.plan?.slug || 'starter';
    const limitPerProf = planSlug === 'business' ? 200 : planSlug === 'professional' ? 100 : 50;
    const professionalAppointmentsThisMonth = await this.prisma.appointment.count({
      where: {
        companyId: company.id,
        professionalId: professional.id,
        createdAt: { gte: startOfMonth },
        status: { not: AppointmentStatus.CANCELLED },
      },
    });

    if (professionalAppointmentsThisMonth >= limitPerProf) {
      throw new ForbiddenException(
        `O profissional ${professional.name} atingiu o limite mensal de ${limitPerProf} agendamentos deste plano. Entre em contato diretamente pelo WhatsApp do estabelecimento.`,
      );
    }

    const startDateTime = new Date(dto.startDateTime);
    const endDateTime = addMinutes(startDateTime, service.durationMinutes);

    if (isBefore(startDateTime, new Date())) {
      throw new BadRequestException('Não é possível agendar em datas passadas');
    }

    // 5. TRANSAÇÃO ATÔMICA COM PREVENÇÃO DE CONCORRÊNCIA (DUPLA RESERVA)
    const appointment = await this.prisma.$transaction(async (tx) => {
      // Bloqueio / Verificação de sobreposição no banco
      const conflict = await tx.appointment.findFirst({
        where: {
          companyId: company.id,
          professionalId: professional.id,
          status: { not: AppointmentStatus.CANCELLED },
          startDateTime: { lt: endDateTime },
          endDateTime: { gt: startDateTime },
        },
      });

      if (conflict) {
        throw new ConflictException(
          'Este horário acabou de ser reservado por outro cliente. Por favor, selecione outro horário.',
        );
      }

      // Verificar conflito com bloqueios de agenda
      const blocked = await tx.blockedTime.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { professionalId: professional.id },
            { professionalId: null },
          ],
          startDateTime: { lt: endDateTime },
          endDateTime: { gt: startDateTime },
        },
      });

      if (blocked) {
        throw new ConflictException('O profissional não estará disponível neste período');
      }

      // Localizar ou criar cliente na empresa
      const cleanPhone = dto.clientPhone.replace(/\D/g, '');
      let client = await tx.client.findUnique({
        where: {
          companyId_phone: {
            companyId: company.id,
            phone: cleanPhone,
          },
        },
      });

      if (!client) {
        client = await tx.client.create({
          data: {
            companyId: company.id,
            name: dto.clientName.trim(),
            phone: cleanPhone,
            email: dto.clientEmail ? dto.clientEmail.trim().toLowerCase() : null,
            totalAppointments: 1,
            lastAppointmentAt: startDateTime,
          },
        });
      } else {
        client = await tx.client.update({
          where: { id: client.id },
          data: {
            name: dto.clientName.trim(),
            ...(dto.clientEmail && { email: dto.clientEmail.trim().toLowerCase() }),
            totalAppointments: { increment: 1 },
            lastAppointmentAt: startDateTime,
          },
        });
      }

      // Verificar se a empresa exige sinal para confirmação
      const companySettings = (company.settings as Record<string, any>) || {};
      const requiresDeposit = Boolean(companySettings.requiresDeposit);
      const initialStatus = requiresDeposit ? AppointmentStatus.PENDING : AppointmentStatus.CONFIRMED;

      // Processar Cupom de Desconto (se informado)
      let finalPrice = service.price;
      let discountAmount = 0;
      let validCouponCode: string | null = null;

      if (dto.couponCode) {
        const cleanCouponCode = dto.couponCode.trim().toUpperCase().replace(/\s+/g, '');
        const coupon = await tx.coupon.findUnique({
          where: {
            companyId_code: {
              companyId: company.id,
              code: cleanCouponCode,
            },
          },
        });

        if (coupon && coupon.isActive) {
          const notExpired = !coupon.validUntil || new Date() <= coupon.validUntil;
          const hasUses = coupon.maxUses === null || coupon.usedCount < coupon.maxUses;
          const profMatches = !coupon.professionalId || coupon.professionalId === professional.id;
          const minMet = !coupon.minOrderValue || Number(service.price) >= Number(coupon.minOrderValue);

          if (notExpired && hasUses && profMatches && minMet) {
            validCouponCode = coupon.code;
            if (coupon.discountType === 'PERCENTAGE') {
              discountAmount = (Number(service.price) * Number(coupon.discountValue)) / 100;
            } else {
              discountAmount = Math.min(Number(service.price), Number(coupon.discountValue));
            }
            discountAmount = Math.round(discountAmount * 100) / 100;
            finalPrice = new Prisma.Decimal(
              Math.max(0, Math.round((Number(service.price) - discountAmount) * 100) / 100),
            );

            // Incrementar contagem de uso do cupom
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      }

      // Criar o Agendamento com o preço congelado no momento da contratação
      return tx.appointment.create({
        data: {
          companyId: company.id,
          professionalId: professional.id,
          serviceId: service.id,
          clientId: client.id,
          startDateTime,
          endDateTime,
          durationMinutes: service.durationMinutes,
          priceAtBooking: finalPrice,
          originalPrice: service.price,
          couponCode: validCouponCode,
          discountAmount: discountAmount > 0 ? new Prisma.Decimal(discountAmount) : null,
          status: initialStatus,
          notes: dto.notes || null,
        },
        include: {
          company: {
            select: { name: true, phone: true, slug: true, logoUrl: true, settings: true },
          },
          professional: {
            select: { name: true, phone: true, avatarUrl: true },
          },
          service: {
            select: { name: true, durationMinutes: true, price: true, imageUrl: true },
          },
          client: true,
        },
      });
    });

    const companySettings = (appointment.company.settings as Record<string, any>) || {};
    const requiresDeposit = appointment.status === AppointmentStatus.PENDING;

    // Disparar notificações assíncronas via WhatsApp apenas se já estiver confirmado
    if (appointment.status === AppointmentStatus.CONFIRMED) {
      this.whatsAppService
        .sendAppointmentConfirmation(appointment.id)
        .catch((err) => console.error('Erro ao processar notificação WhatsApp:', err));
    }

    return {
      success: true,
      message: requiresDeposit
        ? 'Agendamento pré-reservado! Por favor, efetue o pagamento do sinal via Pix para confirmação.'
        : 'Agendamento confirmado com sucesso!',
      appointment,
      requiresDeposit,
      depositInfo: requiresDeposit
        ? {
            depositValue: companySettings.depositValue || 'R$ 20,00',
            pixKey: companySettings.pixKey || '',
            pixKeyType: companySettings.pixKeyType || 'Chave Pix',
            pixRecipientName: companySettings.pixRecipientName || appointment.company.name,
            depositInstructions:
              companySettings.depositInstructions ||
              'Envie o comprovante do sinal pelo WhatsApp para que seu horário seja confirmado.',
            companyPhone: appointment.company.phone,
          }
        : null,
      clientManagementUrl: `/agendamento/${appointment.clientManagementCode}`,
    };
  }

  // Consulta pública por código seguro
  async getAppointmentByManagementCode(code: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { clientManagementCode: code },
      include: {
        company: {
          select: {
            name: true,
            phone: true,
            slug: true,
            logoUrl: true,
            settings: true,
          },
        },
        professional: {
          select: { name: true, phone: true, avatarUrl: true },
        },
        service: {
          select: { name: true, durationMinutes: true, price: true },
        },
        client: {
          select: { name: true, phone: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  // Cancelamento seguro pelo cliente
  async cancelByManagementCode(code: string, dto: CancelAppointmentClientDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { clientManagementCode: code },
      include: { company: true },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Este agendamento já está cancelado');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Atendimento já foi concluído e não pode ser cancelado');
    }

    // Validar política de cancelamento da empresa (ex: antecedência mínima de 2 horas)
    const settings = (appointment.company.settings as Record<string, any>) || {};
    const cancellationPolicyHours = settings.cancellationPolicyHours || 2;
    const hoursNotice = differenceInHours(appointment.startDateTime, new Date());

    if (hoursNotice < cancellationPolicyHours) {
      throw new BadRequestException(
        `O cancelamento deve ser feito com no mínimo ${cancellationPolicyHours} hora(s) de antecedência. Entre em contato diretamente com o estabelecimento.`,
      );
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason || 'Cancelado pelo cliente pelo link de autoatendimento',
      },
    });

    this.whatsAppService
      .sendCancellationNotification(appointment.id, dto.reason)
      .catch((err) => console.error('Erro ao enviar notificação de cancelamento via WhatsApp:', err));

    return updatedAppointment;
  }

  // =========================================================================
  // GESTÃO DA EMPRESA (PAINEL INTERNO PROTEGIDO)
  // =========================================================================
  async listAppointments(
    companyId: string,
    filters?: {
      professionalId?: string;
      status?: AppointmentStatus;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.prisma.appointment.findMany({
      where: {
        companyId,
        ...(filters?.professionalId && { professionalId: filters.professionalId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && {
          startDateTime: { gte: new Date(filters.startDate) },
        }),
        ...(filters?.endDate && {
          endDateTime: { lte: new Date(filters.endDate) },
        }),
      },
      include: {
        client: true,
        professional: true,
        service: true,
      },
      orderBy: { startDateTime: 'asc' },
    });
  }

  async updateAppointmentStatus(
    companyId: string,
    id: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, companyId },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === AppointmentStatus.CANCELLED && {
          cancelledAt: new Date(),
          cancellationReason: dto.cancellationReason || 'Cancelado pela empresa',
        }),
      },
      include: {
        client: true,
        professional: true,
        service: true,
      },
    });

    // Se mudou de PENDING para CONFIRMED (ou foi confirmado pela empresa), envia WhatsApp
    if (dto.status === AppointmentStatus.CONFIRMED && appointment.status === AppointmentStatus.PENDING) {
      this.whatsAppService
        .sendAppointmentConfirmation(appointment.id)
        .catch((err) => console.error('Erro ao enviar notificação WhatsApp após aprovação de sinal:', err));
    }

    return updatedAppointment;
  }

  async deleteAppointment(companyId: string, id: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, companyId },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.prisma.notificationLog.deleteMany({
      where: { appointmentId: id },
    });

    return this.prisma.appointment.delete({
      where: { id },
    });
  }
}
