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
        const maxAppointments = company.subscription?.plan?.maxAppointmentsPerMonth || 100;
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const currentMonthAppointments = await this.prisma.appointment.count({
            where: {
                companyId: company.id,
                createdAt: { gte: startOfMonth },
                status: { not: client_1.AppointmentStatus.CANCELLED },
            },
        });
        if (currentMonthAppointments >= maxAppointments) {
            throw new common_1.ForbiddenException('O estabelecimento atingiu o limite de agendamentos mensais. Entre em contato diretamente pelo WhatsApp.');
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
        const planSlug = company.subscription?.plan?.slug || 'starter';
        const limitPerProf = planSlug === 'business' ? 200 : planSlug === 'professional' ? 100 : 50;
        const professionalAppointmentsThisMonth = await this.prisma.appointment.count({
            where: {
                companyId: company.id,
                professionalId: professional.id,
                createdAt: { gte: startOfMonth },
                status: { not: client_1.AppointmentStatus.CANCELLED },
            },
        });
        if (professionalAppointmentsThisMonth >= limitPerProf) {
            throw new common_1.ForbiddenException(`O profissional ${professional.name} atingiu o limite mensal de ${limitPerProf} agendamentos deste plano. Entre em contato diretamente pelo WhatsApp do estabelecimento.`);
        }
        const startDateTime = new Date(dto.startDateTime);
        const endDateTime = (0, date_fns_1.addMinutes)(startDateTime, service.durationMinutes);
        if ((0, date_fns_1.isBefore)(startDateTime, new Date())) {
            throw new common_1.BadRequestException('Não é possível agendar em datas passadas');
        }
        let appointment = await this.prisma.$transaction(async (tx) => {
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
            const profRequiresDeposit = professional.requiresDeposit;
            const companyRequiresDeposit = Boolean(companySettings.requiresDeposit);
            const requiresDeposit = profRequiresDeposit || companyRequiresDeposit;
            const hasMercadoPago = Boolean(professional.mpAccessToken || company.mpAccessToken);
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
            let depositAmount = 0;
            if (requiresDeposit) {
                if (profRequiresDeposit && professional.depositValue) {
                    if (professional.depositType === client_1.DepositType.PERCENTAGE) {
                        depositAmount =
                            Math.round(((Number(finalPrice) * Number(professional.depositValue)) / 100) * 100) / 100;
                    }
                    else {
                        depositAmount = Math.min(Number(finalPrice), Number(professional.depositValue));
                    }
                }
                else {
                    const raw = String(companySettings.depositValue || '20')
                        .replace('R$', '')
                        .trim()
                        .replace(',', '.');
                    depositAmount = parseFloat(raw) || 20;
                }
            }
            const initialStatus = requiresDeposit
                ? hasMercadoPago
                    ? client_1.AppointmentStatus.PENDING_PAYMENT
                    : client_1.AppointmentStatus.PENDING
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
                    depositAmount: depositAmount > 0 ? new client_1.Prisma.Decimal(depositAmount) : null,
                    status: initialStatus,
                    notes: dto.notes || null,
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
        const companySettings = appointment.company.settings || {};
        const isPendingPayment = appointment.status === client_1.AppointmentStatus.PENDING_PAYMENT;
        const isPendingManual = appointment.status === client_1.AppointmentStatus.PENDING;
        const requiresDeposit = isPendingPayment || isPendingManual;
        const effectiveMpToken = appointment.professional?.mpAccessToken || appointment.company?.mpAccessToken;
        if (isPendingPayment && effectiveMpToken) {
            try {
                const mpPix = await this.mercadoPagoService.createPixPayment({
                    professionalAccessToken: effectiveMpToken,
                    appointmentId: appointment.id,
                    amount: Number(appointment.depositAmount || 20),
                    payerEmail: dto.clientEmail || appointment.client.email || 'cliente@inovaagenda.com',
                    payerName: dto.clientName || appointment.client.name,
                    serviceName: appointment.service.name,
                    companyName: appointment.company.name,
                });
                appointment = await this.prisma.appointment.update({
                    where: { id: appointment.id },
                    data: {
                        mpPaymentId: mpPix.mpPaymentId,
                        pixCopiaECola: mpPix.pixCopiaECola,
                        pixQrCodeBase64: mpPix.pixQrCodeBase64,
                        pixPaymentUrl: mpPix.pixPaymentUrl,
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
            catch (err) {
                console.error('Falha ao gerar cobrança Pix no Mercado Pago:', err);
            }
        }
        if (appointment.status === client_1.AppointmentStatus.CONFIRMED) {
            this.whatsAppService
                .sendAppointmentConfirmation(appointment.id)
                .catch((err) => console.error('Erro ao processar notificação WhatsApp:', err));
        }
        return {
            success: true,
            message: isPendingPayment
                ? 'Agendamento pré-reservado! Efetue o pagamento do Pix para confirmação automática imediata.'
                : isPendingManual
                    ? 'Agendamento pré-reservado! Por favor, efetue o pagamento do sinal via Pix para confirmação.'
                    : 'Agendamento confirmado com sucesso!',
            appointment,
            requiresDeposit,
            depositInfo: requiresDeposit
                ? {
                    isMercadoPago: Boolean(appointment.pixQrCodeBase64 || appointment.pixCopiaECola),
                    depositAmount: Number(appointment.depositAmount || 0),
                    depositValue: `R$ ${Number(appointment.depositAmount || 0).toFixed(2)}`,
                    pixQrCodeBase64: appointment.pixQrCodeBase64 || null,
                    pixCopiaECola: appointment.pixCopiaECola || null,
                    pixPaymentUrl: appointment.pixPaymentUrl || null,
                    pixKey: companySettings.pixKey || '',
                    pixKeyType: companySettings.pixKeyType || 'Chave Pix',
                    pixRecipientName: appointment.professional?.name ||
                        companySettings.pixRecipientName ||
                        appointment.company.name,
                    depositInstructions: appointment.pixCopiaECola
                        ? 'Escaneie o QR Code ou copie a chave Pix abaixo. Assim que o pagamento for concluído, sua vaga será confirmada automaticamente!'
                        : companySettings.depositInstructions ||
                            'Envie o comprovante do sinal pelo WhatsApp para que seu horário seja confirmado.',
                    companyPhone: appointment.company.phone,
                }
                : null,
            clientManagementUrl: `/agendamento/${appointment.clientManagementCode}`,
        };
    }
    async getAppointmentByManagementCode(code) {
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
                review: {
                    select: { id: true, rating: true, comment: true, createdAt: true },
                },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        return appointment;
    }
    async cancelByManagementCode(code, dto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { clientManagementCode: code },
            include: { company: true },
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
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                status: client_1.AppointmentStatus.CANCELLED,
                cancelledAt: new Date(),
                cancellationReason: dto.reason || 'Cancelado pelo cliente pelo link de autoatendimento',
            },
        });
        this.whatsAppService
            .sendCancellationNotification(appointment.id, dto.reason)
            .catch((err) => console.error('Erro ao enviar notificação de cancelamento via WhatsApp:', err));
        return updatedAppointment;
    }
    async listAppointments(companyId, filters) {
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
    async updateAppointmentStatus(companyId, id, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const appointment = await this.prisma.appointment.findFirst({
            where: { id, companyId },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id },
            data: {
                status: dto.status,
                ...(dto.status === client_1.AppointmentStatus.CANCELLED && {
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
        if (dto.status === client_1.AppointmentStatus.CONFIRMED && appointment.status === client_1.AppointmentStatus.PENDING) {
            this.whatsAppService
                .sendAppointmentConfirmation(appointment.id)
                .catch((err) => console.error('Erro ao enviar notificação WhatsApp após aprovação de sinal:', err));
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