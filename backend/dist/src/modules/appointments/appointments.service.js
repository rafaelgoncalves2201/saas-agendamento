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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const mercadopago_service_1 = require("../mercadopago/mercadopago.service");
const plans_config_1 = require("../../common/config/plans.config");
let AppointmentsService = class AppointmentsService {
    prisma;
    whatsAppService;
    mercadoPagoService;
    constructor(prisma, whatsAppService, mercadoPagoService) {
        this.prisma = prisma;
        this.whatsAppService = whatsAppService;
        this.mercadoPagoService = mercadoPagoService;
    }
    async createPublicAppointment(companySlug, dto) {
        const company = await this.prisma.company.findUnique({
            where: { slug: companySlug },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });
        if (!company || !company.isActive) {
            throw new common_1.NotFoundException('Empresa não encontrada ou inativa');
        }
        const sub = company.subscription;
        const planSlug = sub?.plan?.slug;
        const planConfig = (0, plans_config_1.getPlanConfig)(planSlug);
        const now = new Date();
        let periodStart;
        let periodEnd;
        if (sub &&
            sub.currentPeriodStart &&
            sub.currentPeriodEnd &&
            now >= sub.currentPeriodStart &&
            now <= sub.currentPeriodEnd) {
            periodStart = sub.currentPeriodStart;
            periodEnd = sub.currentPeriodEnd;
        }
        else {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        if (planConfig.maxAppointmentsPerMonth < 999999) {
            const currentPeriodAppointments = await this.prisma.appointment.count({
                where: {
                    companyId: company.id,
                    createdAt: { gte: periodStart, lte: periodEnd },
                    status: { not: client_1.AppointmentStatus.CANCELLED },
                },
            });
            if (currentPeriodAppointments >= planConfig.maxAppointmentsPerMonth) {
                if (planConfig.tier === plans_config_1.PlanTier.BASIC) {
                    throw new common_1.ForbiddenException('Você atingiu o limite de 50 agendamentos deste mês. Faça upgrade para o plano Profissional e tenha até 100 agendamentos por mês.');
                }
                else if (planConfig.tier === plans_config_1.PlanTier.PROFESSIONAL) {
                    throw new common_1.ForbiddenException('Você atingiu o limite de 100 agendamentos deste mês. Faça upgrade para o plano Premium e tenha agendamentos sem limite.');
                }
            }
        }
        const service = await this.prisma.service.findFirst({
            where: { id: dto.serviceId, companyId: company.id, isActive: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('Serviço não encontrado ou inativo');
        }
        const professional = await this.prisma.professional.findFirst({
            where: { id: dto.professionalId, companyId: company.id, isActive: true },
        });
        if (!professional) {
            throw new common_1.NotFoundException('Profissional não encontrado ou inativo');
        }
        const startDateTime = new Date(dto.startDateTime);
        const endDateTime = (0, date_fns_1.addMinutes)(startDateTime, service.durationMinutes);
        if ((0, date_fns_1.isBefore)(startDateTime, new Date())) {
            throw new common_1.BadRequestException('Não é possível agendar em datas passadas');
        }
        let appointment = await this.prisma.$transaction(async (tx) => {
            const expirationLimit = new Date(Date.now() - 15 * 60 * 1000);
            await tx.appointment.updateMany({
                where: {
                    companyId: company.id,
                    status: client_1.AppointmentStatus.PENDING_PAYMENT,
                    paidAt: null,
                    OR: [
                        { mpPaymentId: { not: null } },
                        { pixQrCodeBase64: { not: null } },
                        { cardPaymentUrl: { not: null } },
                    ],
                    createdAt: { lt: expirationLimit },
                },
                data: {
                    status: client_1.AppointmentStatus.CANCELLED,
                    cancellationReason: 'Tempo de pagamento do Mercado Pago expirado (15 minutos)',
                    cancelledAt: new Date(),
                },
            });
            const conflict = await tx.appointment.findFirst({
                where: {
                    companyId: company.id,
                    professionalId: professional.id,
                    status: { not: client_1.AppointmentStatus.CANCELLED },
                    startDateTime: { lt: endDateTime },
                    endDateTime: { gt: startDateTime },
                },
            });
            if (conflict) {
                throw new common_1.ConflictException('Este horário acabou de ser reservado por outro cliente. Por favor, selecione outro horário.');
            }
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
                throw new common_1.ConflictException('O profissional não estará disponível neste período');
            }
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
            }
            else {
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
            const companySettings = company.settings || {};
            const hasMercadoPago = Boolean(professional.mpAccessToken || company.mpAccessToken);
            let paymentModel = companySettings.paymentModel;
            if (!paymentModel) {
                const companyRequiresDeposit = companySettings.requiresDeposit !== false;
                const profRequiresDeposit = professional.requiresDeposit;
                const requiresDeposit = companyRequiresDeposit || profRequiresDeposit;
                if (!requiresDeposit) {
                    paymentModel = 'NONE';
                }
                else if (hasMercadoPago) {
                    paymentModel = 'MERCADO_PAGO';
                }
                else {
                    paymentModel = 'DEPOSIT_PIX';
                }
            }
            if (paymentModel === 'MERCADO_PAGO' && !hasMercadoPago && !process.env.MERCADO_PAGO_ACCESS_TOKEN) {
                paymentModel = 'DEPOSIT_PIX';
            }
            let finalPrice = service.price;
            let discountAmount = 0;
            let validCouponCode = null;
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
                        }
                        else {
                            discountAmount = Math.min(Number(service.price), Number(coupon.discountValue));
                        }
                        discountAmount = Math.round(discountAmount * 100) / 100;
                        finalPrice = new client_1.Prisma.Decimal(Math.max(0, Math.round((Number(service.price) - discountAmount) * 100) / 100));
                        await tx.coupon.update({
                            where: { id: coupon.id },
                            data: { usedCount: { increment: 1 } },
                        });
                    }
                }
            }
            let depositToPay = finalPrice;
            const finalPriceNum = Number(finalPrice);
            if (paymentModel === 'NONE' || finalPriceNum <= 0) {
                depositToPay = new client_1.Prisma.Decimal(0);
            }
            else if (paymentModel === 'DEPOSIT_PIX') {
                const hasProfDeposit = Boolean(professional.requiresDeposit &&
                    professional.depositValue !== null &&
                    professional.depositValue !== undefined);
                let customDepositValue = hasProfDeposit
                    ? professional.depositValue
                    : companySettings.depositValue;
                let depositType = hasProfDeposit
                    ? (professional.depositType || 'FIXED')
                    : (String(customDepositValue).includes('%') ? 'PERCENTAGE' : 'FIXED');
                if (customDepositValue !== undefined && customDepositValue !== null) {
                    const numVal = parseFloat(String(customDepositValue).replace(/[^\d.,]/g, '').replace(',', '.'));
                    if (!isNaN(numVal) && numVal > 0) {
                        if (depositType === 'PERCENTAGE' || String(customDepositValue).includes('%')) {
                            const pct = Math.min(100, Math.max(1, numVal));
                            depositToPay = new client_1.Prisma.Decimal(Math.min(finalPriceNum, Math.round(((finalPriceNum * pct) / 100) * 100) / 100));
                        }
                        else {
                            depositToPay = new client_1.Prisma.Decimal(Math.min(finalPriceNum, numVal));
                        }
                    }
                    else {
                        depositToPay = new client_1.Prisma.Decimal(Math.min(finalPriceNum, 50));
                    }
                }
                else {
                    depositToPay = new client_1.Prisma.Decimal(Math.min(finalPriceNum, 50));
                }
            }
            else {
                depositToPay = finalPrice;
            }
            const isPendingPayment = paymentModel !== 'NONE' && Number(depositToPay) > 0;
            const initialStatus = isPendingPayment
                ? client_1.AppointmentStatus.PENDING_PAYMENT
                : client_1.AppointmentStatus.CONFIRMED;
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
                    discountAmount: discountAmount > 0 ? new client_1.Prisma.Decimal(discountAmount) : null,
                    depositAmount: depositToPay,
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
        const isPendingPayment = appointment.status === client_1.AppointmentStatus.PENDING_PAYMENT;
        const depositAmountNum = Number(appointment.depositAmount || 0);
        const totalPriceNum = Number(appointment.priceAtBooking || 0);
        const remainingToPayNum = Math.max(0, totalPriceNum - depositAmountNum);
        const companySettings = appointment.company.settings || {};
        const hasMpToken = Boolean(appointment.professional?.mpAccessToken ||
            appointment.company?.mpAccessToken ||
            process.env.MERCADO_PAGO_ACCESS_TOKEN);
        const configuredModel = companySettings.paymentModel;
        const shouldUseMercadoPago = configuredModel === 'MERCADO_PAGO' ||
            (!configuredModel && hasMpToken);
        if (isPendingPayment && shouldUseMercadoPago && depositAmountNum > 0) {
            const effectiveMpToken = appointment.professional?.mpAccessToken ||
                appointment.company?.mpAccessToken ||
                process.env.MERCADO_PAGO_ACCESS_TOKEN;
            if (effectiveMpToken) {
                let mpPaymentId = null;
                let pixCopiaECola = null;
                let pixQrCodeBase64 = null;
                let pixPaymentUrl = null;
                let cardPaymentUrl = null;
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
                }
                catch (err) {
                    console.error('Falha ao gerar cobrança Pix do valor total no Mercado Pago:', err);
                }
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
                }
                catch (err) {
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
        if (appointment.status === client_1.AppointmentStatus.CONFIRMED) {
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
                    pixRecipientName: companySettings.pixRecipientName ||
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
    async getAppointmentByManagementCode(code, paymentId, paymentStatus) {
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
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        if (appointment.status === client_1.AppointmentStatus.PENDING_PAYMENT && paymentId) {
            if (appointment.mpPaymentId !== String(paymentId)) {
                await this.prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { mpPaymentId: String(paymentId) },
                });
                appointment.mpPaymentId = String(paymentId);
            }
        }
        if (appointment.status === client_1.AppointmentStatus.PENDING_PAYMENT && appointment.mpPaymentId) {
            const confirmed = await this.mercadoPagoService.checkAndConfirmPayment(appointment.id);
            if (confirmed) {
                appointment = confirmed;
            }
        }
        return appointment;
    }
    async cancelByManagementCode(code, dto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { clientManagementCode: code },
            include: {
                company: true,
                professional: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        if (appointment.status === client_1.AppointmentStatus.CANCELLED) {
            throw new common_1.BadRequestException('Este agendamento já está cancelado');
        }
        if (appointment.status === client_1.AppointmentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Atendimento já foi concluído e não pode ser cancelado');
        }
        const settings = appointment.company.settings || {};
        const cancellationPolicyHours = settings.cancellationPolicyHours || 2;
        const hoursNotice = (0, date_fns_1.differenceInHours)(appointment.startDateTime, new Date());
        if (hoursNotice < cancellationPolicyHours) {
            throw new common_1.BadRequestException(`O cancelamento deve ser feito com no mínimo ${cancellationPolicyHours} hora(s) de antecedência. Entre em contato diretamente com o estabelecimento.`);
        }
        let cancellationReason = dto.reason || 'Cancelado pelo cliente pelo link de autoatendimento';
        if (appointment.status === client_1.AppointmentStatus.CONFIRMED && appointment.mpPaymentId) {
            const accessToken = appointment.professional?.mpAccessToken ||
                appointment.company?.mpAccessToken ||
                process.env.MERCADO_PAGO_ACCESS_TOKEN ||
                '';
            const refund = await this.mercadoPagoService.refundPayment(appointment.mpPaymentId, accessToken);
            if (refund.success) {
                cancellationReason += ` (Estorno automático Mercado Pago realizado com sucesso - ID: ${refund.refundId})`;
            }
            else {
                cancellationReason += ` (Falha no estorno automático: ${refund.error})`;
            }
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                status: client_1.AppointmentStatus.CANCELLED,
                cancelledAt: new Date(),
                cancellationReason,
            },
        });
        this.whatsAppService
            .sendCancellationNotification(appointment.id, cancellationReason)
            .catch((err) => console.error('Erro ao enviar notificação de cancelamento via WhatsApp:', err));
        return updatedAppointment;
    }
    async listAppointments(companyId, filters) {
        const statusCondition = filters?.status
            ? (filters.status === client_1.AppointmentStatus.PENDING || filters.status === 'PENDING_PAYMENT'
                ? { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.PENDING_PAYMENT] }
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
    async updateAppointmentStatus(companyId, id, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const appointment = await this.prisma.appointment.findFirst({
            where: { id, companyId },
            include: {
                professional: true,
                company: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        let cancellationReason = dto.cancellationReason || 'Cancelado pela empresa';
        if (dto.status === client_1.AppointmentStatus.CANCELLED &&
            appointment.status === client_1.AppointmentStatus.CONFIRMED &&
            appointment.mpPaymentId) {
            const accessToken = appointment.professional?.mpAccessToken ||
                appointment.company?.mpAccessToken ||
                process.env.MERCADO_PAGO_ACCESS_TOKEN ||
                '';
            const refund = await this.mercadoPagoService.refundPayment(appointment.mpPaymentId, accessToken);
            if (refund.success) {
                cancellationReason += ` (Estorno automático Mercado Pago realizado com sucesso - ID: ${refund.refundId})`;
            }
            else {
                cancellationReason += ` (Falha no estorno automático: ${refund.error})`;
            }
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id },
            data: {
                status: dto.status,
                ...(dto.status === client_1.AppointmentStatus.CANCELLED && {
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
        if (dto.status === client_1.AppointmentStatus.CANCELLED && appointment.status !== client_1.AppointmentStatus.CANCELLED) {
            this.whatsAppService
                .sendCancellationNotification(appointment.id, cancellationReason)
                .catch((err) => console.error('Erro ao enviar notificação de cancelamento WhatsApp:', err));
        }
        if (dto.status === client_1.AppointmentStatus.CONFIRMED && appointment.status !== client_1.AppointmentStatus.CONFIRMED) {
            this.whatsAppService
                .sendAppointmentConfirmation(appointment.id)
                .catch((err) => console.error('Erro ao enviar notificação WhatsApp após confirmação:', err));
        }
        return updatedAppointment;
    }
    async deleteAppointment(companyId, id) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const appointment = await this.prisma.appointment.findFirst({
            where: { id, companyId },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        await this.prisma.notificationLog.deleteMany({
            where: { appointmentId: id },
        });
        return this.prisma.appointment.delete({
            where: { id },
        });
    }
    async rescheduleAppointment(companyId, id, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
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
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        const targetProfId = dto.professionalId || appointment.professionalId;
        const newStart = new Date(dto.startDateTime);
        if (isNaN(newStart.getTime())) {
            throw new common_1.BadRequestException('Data e hora inválida para reagendamento');
        }
        const newEnd = (0, date_fns_1.addMinutes)(newStart, appointment.service.durationMinutes);
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                id: { not: id },
                companyId,
                professionalId: targetProfId,
                status: { notIn: [client_1.AppointmentStatus.CANCELLED] },
                AND: [
                    { startDateTime: { lt: newEnd } },
                    { endDateTime: { gt: newStart } },
                ],
            },
        });
        if (conflict) {
            throw new common_1.ConflictException('Já existe outro atendimento agendado para este profissional no horário solicitado');
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
        this.whatsAppService
            .sendRescheduleNotification(appointment.id)
            .catch((err) => console.error('Erro ao enviar WhatsApp de reagendamento:', err));
        return updated;
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsAppService,
        mercadopago_service_1.MercadoPagoService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map