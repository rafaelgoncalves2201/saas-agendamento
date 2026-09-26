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
  RescheduleAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointment.dto';
import { AppointmentStatus, DepositType, Prisma } from '@prisma/client';
import { addMinutes, differenceInHours, isBefore } from 'date-fns';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { PlanTier, getPlanConfig } from '../../common/config/plans.config';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
    private mercadoPagoService: MercadoPagoService,
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

    // 2. Verificar limite de agendamentos no mês da empresa conforme plano
    const sub = company.subscription;
    const planSlug = sub?.plan?.slug;
    const planConfig = getPlanConfig(planSlug);

    // Determinar período mensal vigente (período da assinatura ou mês calendário atual)
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (
      sub &&
      sub.currentPeriodStart &&
      sub.currentPeriodEnd &&
      now >= sub.currentPeriodStart &&
      now <= sub.currentPeriodEnd
    ) {
      periodStart = sub.currentPeriodStart;
      periodEnd = sub.currentPeriodEnd;
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    if (planConfig.maxAppointmentsPerMonth < 999999) {
      const currentPeriodAppointments = await this.prisma.appointment.count({
        where: {
          companyId: company.id,
          createdAt: { gte: periodStart, lte: periodEnd },
          status: { not: AppointmentStatus.CANCELLED },
        },
      });

      if (currentPeriodAppointments >= planConfig.maxAppointmentsPerMonth) {
        if (planConfig.tier === PlanTier.BASIC) {
          throw new ForbiddenException(
            'Você atingiu o limite de 50 agendamentos deste mês. Faça upgrade para o plano Profissional e tenha até 100 agendamentos por mês.',
          );
        } else if (planConfig.tier === PlanTier.PROFESSIONAL) {
          throw new ForbiddenException(
            'Você atingiu o limite de 100 agendamentos deste mês. Faça upgrade para o plano Premium e tenha agendamentos sem limite.',
          );
        }
      }
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

    const startDateTime = new Date(dto.startDateTime);
    const endDateTime = addMinutes(startDateTime, service.durationMinutes);

    if (isBefore(startDateTime, new Date())) {
      throw new BadRequestException('Não é possível agendar em datas passadas');
    }

    // 5. TRANSAÇÃO ATÔMICA COM PREVENÇÃO DE CONCORRÊNCIA (DUPLA RESERVA)
    let appointment = await this.prisma.$transaction(async (tx) => {
      // Liberar horários de reservas não pagas expiradas do Mercado Pago (mais de 15 minutos)
      const expirationLimit = new Date(Date.now() - 15 * 60 * 1000);
      await tx.appointment.updateMany({
        where: {
          companyId: company.id,
          status: AppointmentStatus.PENDING_PAYMENT,
          paidAt: null,
          OR: [
            { mpPaymentId: { not: null } },
            { pixQrCodeBase64: { not: null } },
            { cardPaymentUrl: { not: null } },
          ],
          createdAt: { lt: expirationLimit },
        },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancellationReason: 'Tempo de pagamento do Mercado Pago expirado (15 minutos)',
          cancelledAt: new Date(),
        },
      });

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

      // Verificar se a empresa ou o profissional exige sinal / pagamento antecipado
      const companySettings = (company.settings as Record<string, any>) || {};
      const hasMercadoPago = Boolean(professional.mpAccessToken || company.mpAccessToken);

      // Modalidades de cobrança suportadas:
      // - 'MERCADO_PAGO': Pagamento total antecipado via Mercado Pago (Pix e Cartão até 12x com confirmação automática)
      // - 'DEPOSIT_PIX': Cobrança de sinal na chave Pix de preferência (restante pago no atendimento presencial)
      // - 'NONE': Agendamento livre sem sinal (pago no local)
      let paymentModel: 'MERCADO_PAGO' | 'DEPOSIT_PIX' | 'NONE' = companySettings.paymentModel;

      if (!paymentModel) {
        const companyRequiresDeposit = companySettings.requiresDeposit !== false;
        const profRequiresDeposit = professional.requiresDeposit;
        const requiresDeposit = companyRequiresDeposit || profRequiresDeposit;

        if (!requiresDeposit) {
          paymentModel = 'NONE';
        } else if (hasMercadoPago) {
          paymentModel = 'MERCADO_PAGO';
        } else {
          paymentModel = 'DEPOSIT_PIX';
        }
      }

      // Se selecionou MERCADO_PAGO mas nenhuma conta está conectada, faz fallback inteligente para DEPOSIT_PIX
      if (paymentModel === 'MERCADO_PAGO' && !hasMercadoPago && !process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        paymentModel = 'DEPOSIT_PIX';
      }

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

      // Calcular valor do sinal ou pagamento antecipado
      let depositToPay = finalPrice;
      const finalPriceNum = Number(finalPrice);

      if (paymentModel === 'NONE' || finalPriceNum <= 0) {
        depositToPay = new Prisma.Decimal(0);
      } else if (paymentModel === 'DEPOSIT_PIX') {
        // Sinal via Chave Pix direta: usa valor do profissional (se configurado explicitamente) ou do estabelecimento
        const hasProfDeposit = Boolean(
          professional.requiresDeposit &&
          professional.depositValue !== null &&
          professional.depositValue !== undefined
        );
        let customDepositValue = hasProfDeposit
          ? professional.depositValue
          : companySettings.depositValue;
        let depositType = hasProfDeposit
          ? (professional.depositType || 'FIXED')
          : (String(customDepositValue).includes('%') ? 'PERCENTAGE' : 'FIXED');

        if (customDepositValue !== undefined && customDepositValue !== null) {
          const numVal = parseFloat(
            String(customDepositValue).replace(/[^\d.,]/g, '').replace(',', '.'),
          );
          if (!isNaN(numVal) && numVal > 0) {
            if (depositType === 'PERCENTAGE' || String(customDepositValue).includes('%')) {
              const pct = Math.min(100, Math.max(1, numVal));
              depositToPay = new Prisma.Decimal(
                Math.min(finalPriceNum, Math.round(((finalPriceNum * pct) / 100) * 100) / 100),
              );
            } else {
              depositToPay = new Prisma.Decimal(Math.min(finalPriceNum, numVal));
            }
          } else {
            depositToPay = new Prisma.Decimal(Math.min(finalPriceNum, 50));
          }
        } else {
          // Padrão: R$ 50 ou o valor total do serviço se for menor
          depositToPay = new Prisma.Decimal(Math.min(finalPriceNum, 50));
        }
      } else {
        // MERCADO_PAGO: 100% do valor do atendimento antecipado
        depositToPay = finalPrice;
      }

      const isPendingPayment = paymentModel !== 'NONE' && Number(depositToPay) > 0;
      const initialStatus = isPendingPayment
        ? AppointmentStatus.PENDING_PAYMENT
        : AppointmentStatus.CONFIRMED;

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
          depositAmount: depositToPay, // Registra o valor do sinal ou valor total pago/a pagar
          status: initialStatus,
          notes: dto.notes || null,
          ...(!isPendingPayment && { paidAt: new Date() }),
        },
        include: {
          company: {
            select: { name: true, phone: true, slug: true, logoUrl: true, settings: true, mpAccessToken: true },
          },
          professional: {
            select: { name: true, phone: true, avatarUrl: true, mpAccessToken: true },
          },
          service: {
            select: { name: true, durationMinutes: true, price: true, imageUrl: true },
          },
          client: true,
        },
      });
    });

    const isPendingPayment = appointment.status === AppointmentStatus.PENDING_PAYMENT;
    const depositAmountNum = Number(appointment.depositAmount || 0);
    const totalPriceNum = Number(appointment.priceAtBooking || 0);
    const remainingToPayNum = Math.max(0, totalPriceNum - depositAmountNum);
    const companySettings = (appointment.company.settings as Record<string, any>) || {};

    // Determina se usará Mercado Pago ou Sinal via Chave Pix
    const hasMpToken = Boolean(
      appointment.professional?.mpAccessToken ||
      appointment.company?.mpAccessToken ||
      process.env.MERCADO_PAGO_ACCESS_TOKEN
    );
    const configuredModel = companySettings.paymentModel;
    const shouldUseMercadoPago =
      configuredModel === 'MERCADO_PAGO' ||
      (!configuredModel && hasMpToken);

    // Se a modalidade for Mercado Pago e estiver aguardando pagamento
    if (isPendingPayment && shouldUseMercadoPago && depositAmountNum > 0) {
      const effectiveMpToken =
        appointment.professional?.mpAccessToken ||
        appointment.company?.mpAccessToken ||
        process.env.MERCADO_PAGO_ACCESS_TOKEN;

      if (effectiveMpToken) {
        let mpPaymentId: string | null = null;
        let pixCopiaECola: string | null = null;
        let pixQrCodeBase64: string | null = null;
        let pixPaymentUrl: string | null = null;
        let cardPaymentUrl: string | null = null;

        // 1. Gera cobrança Pix via Mercado Pago
        try {
          const mpPix = await this.mercadoPagoService.createPixPayment({
            professionalAccessToken: effectiveMpToken,
            appointmentId: appointment.id,
            amount: depositAmountNum,
            payerEmail: dto.clientEmail || appointment.client.email || 'cliente@inovaagenda.com',
            payerName: dto.clientName || appointment.client.name,
            serviceName: appointment.service.name,
            companyName: appointment.company.name,
          });

          mpPaymentId = mpPix.mpPaymentId;
          pixCopiaECola = mpPix.pixCopiaECola;
          pixQrCodeBase64 = mpPix.pixQrCodeBase64;
          pixPaymentUrl = mpPix.pixPaymentUrl || null;
        } catch (err) {
          console.error('Falha ao gerar cobrança Pix do valor total no Mercado Pago:', err);
        }

        // 2. Gera Preferência de Checkout para Cartão de Crédito / Débito (parcelamento até 12x)
        try {
          const mpCard = await this.mercadoPagoService.createCardPaymentPreference({
            accessToken: effectiveMpToken,
            appointmentId: appointment.id,
            clientManagementCode: appointment.clientManagementCode,
            amount: depositAmountNum,
            payerEmail: dto.clientEmail || appointment.client.email || 'cliente@inovaagenda.com',
            payerName: dto.clientName || appointment.client.name,
            serviceName: appointment.service.name,
            companyName: appointment.company.name,
          });

          cardPaymentUrl = mpCard.initPoint;
        } catch (err) {
          console.error('Falha ao gerar preferência de Cartão no Mercado Pago:', err);
        }

        appointment = await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            mpPaymentId,
            pixCopiaECola,
            pixQrCodeBase64,
            pixPaymentUrl,
            cardPaymentUrl,
          },
          include: {
            company: {
              select: { name: true, phone: true, slug: true, logoUrl: true, settings: true, mpAccessToken: true },
            },
            professional: {
              select: { name: true, phone: true, avatarUrl: true, mpAccessToken: true },
            },
            service: {
              select: { name: true, durationMinutes: true, price: true, imageUrl: true },
            },
            client: true,
          },
        });
      }
    }

    // Disparar notificações de WhatsApp apenas se já estiver confirmado (ex: gratuito / sem sinal)
    if (appointment.status === AppointmentStatus.CONFIRMED) {
      this.whatsAppService
        .sendAppointmentConfirmation(appointment.id)
        .catch((err) => console.error('Erro ao processar notificação WhatsApp:', err));
    }

    const isMercadoPago = Boolean(appointment.pixCopiaECola || appointment.cardPaymentUrl);

    return {
      success: true,
      message: !isPendingPayment
        ? 'Agendamento confirmado com sucesso!'
        : isMercadoPago
        ? 'Horário pré-reservado por 15 minutos! Pague com Pix ou Cartão de Crédito para confirmação automática imediata.'
        : `Horário pré-reservado! Efetue o pagamento do sinal de R$ ${depositAmountNum.toFixed(2)} e envie o comprovante no WhatsApp para confirmação. O restante (R$ ${remainingToPayNum.toFixed(2)}) será pago no atendimento.`,
      appointment,
      requiresDeposit: isPendingPayment,
      depositInfo: isPendingPayment
        ? {
            paymentModel: isMercadoPago ? 'MERCADO_PAGO' : 'DEPOSIT_PIX',
            isMercadoPago,
            depositAmount: depositAmountNum,
            depositValue: `R$ ${depositAmountNum.toFixed(2)}`,
            totalPrice: totalPriceNum,
            remainingAmount: remainingToPayNum,
            remainingValue: `R$ ${remainingToPayNum.toFixed(2)}`,
            pixQrCodeBase64: appointment.pixQrCodeBase64 || null,
            pixCopiaECola: appointment.pixCopiaECola || null,
            pixPaymentUrl: appointment.pixPaymentUrl || null,
            cardPaymentUrl: appointment.cardPaymentUrl || null,
            pixKey: isMercadoPago ? (appointment.pixCopiaECola || '') : (companySettings.pixKey || ''),
            pixKeyType: isMercadoPago
              ? 'Pix Mercado Pago (Pagamento Total)'
              : (companySettings.pixKeyType || 'Chave Pix'),
            pixRecipientName:
              companySettings.pixRecipientName ||
              appointment.company.name ||
              appointment.professional?.name,
            depositInstructions: isMercadoPago
              ? 'Pague instantaneamente via Pix ou parcele em até 12x no Cartão de Crédito. A confirmação do agendamento é automática e em tempo real.'
              : (companySettings.depositInstructions ||
                'Transfira o valor do sinal via Pix e envie o comprovante pelo WhatsApp para confirmar seu horário. O restante será pago presencialmente após o atendimento.'),
            whatsappButtonText: companySettings.whatsappButtonText || 'Enviar Comprovante pelo WhatsApp',
            companyPhone: appointment.company.phone,
          }
        : null,
      clientManagementUrl: `/agendamento/${appointment.clientManagementCode}`,
    };
  }

  // Consulta pública por código seguro (com auto-verificação em tempo real do Mercado Pago)
  async getAppointmentByManagementCode(
    code: string,
    paymentId?: string,
    paymentStatus?: string,
  ) {
    let appointment = await this.prisma.appointment.findUnique({
      where: { clientManagementCode: code },
      include: {
        company: {
          select: {
            name: true,
            phone: true,
            slug: true,
            logoUrl: true,
            settings: true,
            mpAccessToken: true,
          },
        },
        professional: {
          select: { name: true, phone: true, avatarUrl: true, mpAccessToken: true },
        },
        service: {
          select: { name: true, durationMinutes: true, price: true },
        },
        client: {
          select: { name: true, phone: true },
        },
        review: {
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Se o cliente retornou do checkout de cartão Mercado Pago com payment_id
    if (appointment.status === AppointmentStatus.PENDING_PAYMENT && paymentId) {
      if (appointment.mpPaymentId !== String(paymentId)) {
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { mpPaymentId: String(paymentId) },
        });
        appointment.mpPaymentId = String(paymentId);
      }
    }

    // Se estiver aguardando pagamento do Mercado Pago, checa o status ativamente
    if (appointment.status === AppointmentStatus.PENDING_PAYMENT && appointment.mpPaymentId) {
      const confirmed = await this.mercadoPagoService.checkAndConfirmPayment(appointment.id);
      if (confirmed) {
        appointment = confirmed as any;
      }
    }

    return appointment;
  }

  // Cancelamento seguro pelo cliente
  async cancelByManagementCode(code: string, dto: CancelAppointmentClientDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { clientManagementCode: code },
      include: {
        company: true,
        professional: true,
      },
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

    let cancellationReason = dto.reason || 'Cancelado pelo cliente pelo link de autoatendimento';

    // Se o agendamento já estava pago (CONFIRMED) via Mercado Pago (Pix ou Cartão), estornar automaticamente
    if (appointment.status === AppointmentStatus.CONFIRMED && appointment.mpPaymentId) {
      const accessToken =
        appointment.professional?.mpAccessToken ||
        appointment.company?.mpAccessToken ||
        process.env.MERCADO_PAGO_ACCESS_TOKEN ||
        '';

      const refund = await this.mercadoPagoService.refundPayment(appointment.mpPaymentId, accessToken);
      if (refund.success) {
        cancellationReason += ` (Estorno automático Mercado Pago realizado com sucesso - ID: ${refund.refundId})`;
      } else {
        cancellationReason += ` (Falha no estorno automático: ${refund.error})`;
      }
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason,
      },
    });

    this.whatsAppService
      .sendCancellationNotification(appointment.id, cancellationReason)
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
    const statusCondition = filters?.status
      ? (filters.status === AppointmentStatus.PENDING || (filters.status as any) === 'PENDING_PAYMENT'
          ? { in: [AppointmentStatus.PENDING, AppointmentStatus.PENDING_PAYMENT] }
          : filters.status)
      : undefined;

    return this.prisma.appointment.findMany({
      where: {
        companyId,
        ...(filters?.professionalId && { professionalId: filters.professionalId }),
        ...(statusCondition && { status: statusCondition }),
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
      include: {
        professional: true,
        company: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    let cancellationReason = dto.cancellationReason || 'Cancelado pela empresa';

    // Se mudou para CANCELLED e o agendamento já estava pago (CONFIRMED) com mpPaymentId, estorna automaticamente
    if (
      dto.status === AppointmentStatus.CANCELLED &&
      appointment.status === AppointmentStatus.CONFIRMED &&
      appointment.mpPaymentId
    ) {
      const accessToken =
        appointment.professional?.mpAccessToken ||
        appointment.company?.mpAccessToken ||
        process.env.MERCADO_PAGO_ACCESS_TOKEN ||
        '';

      const refund = await this.mercadoPagoService.refundPayment(appointment.mpPaymentId, accessToken);
      if (refund.success) {
        cancellationReason += ` (Estorno automático Mercado Pago realizado com sucesso - ID: ${refund.refundId})`;
      } else {
        cancellationReason += ` (Falha no estorno automático: ${refund.error})`;
      }
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === AppointmentStatus.CANCELLED && {
          cancelledAt: new Date(),
          cancellationReason,
        }),
      },
      include: {
        client: true,
        professional: true,
        service: true,
      },
    });

    // Se cancelou, envia notificação de cancelamento WhatsApp
    if (dto.status === AppointmentStatus.CANCELLED && appointment.status !== AppointmentStatus.CANCELLED) {
      this.whatsAppService
        .sendCancellationNotification(appointment.id, cancellationReason)
        .catch((err) => console.error('Erro ao enviar notificação de cancelamento WhatsApp:', err));
    }

    // Se mudou para CONFIRMED a partir de pendente, envia notificação WhatsApp
    if (dto.status === AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.CONFIRMED) {
      this.whatsAppService
        .sendAppointmentConfirmation(appointment.id)
        .catch((err) => console.error('Erro ao enviar notificação WhatsApp após confirmação:', err));
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

  async rescheduleAppointment(
    companyId: string,
    id: string,
    dto: RescheduleAppointmentDto,
  ) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: { id, companyId },
      include: {
        service: true,
        professional: true,
        client: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const targetProfId = dto.professionalId || appointment.professionalId;
    const newStart = new Date(dto.startDateTime);
    if (isNaN(newStart.getTime())) {
      throw new BadRequestException('Data e hora inválida para reagendamento');
    }

    const newEnd = addMinutes(newStart, appointment.service.durationMinutes);

    // Conflitos na agenda do profissional
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        id: { not: id },
        companyId,
        professionalId: targetProfId,
        status: { notIn: [AppointmentStatus.CANCELLED] },
        AND: [
          { startDateTime: { lt: newEnd } },
          { endDateTime: { gt: newStart } },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('Já existe outro atendimento agendado para este profissional no horário solicitado');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        startDateTime: newStart,
        endDateTime: newEnd,
        professionalId: targetProfId,
      },
      include: {
        service: true,
        professional: true,
        client: true,
      },
    });

    // Disparar notificação de reagendamento para o WhatsApp do cliente
    this.whatsAppService
      .sendRescheduleNotification(appointment.id)
      .catch((err) => console.error('Erro ao enviar WhatsApp de reagendamento:', err));

    return updated;
  }
}

