import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AsaasProvider } from '../payments/asaas.provider';
import { CheckoutSubscriptionDto } from './dto/checkout.dto';
import {
  BillingCycle,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { addDays, addMonths, addYears, format } from 'date-fns';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private asaasProvider: AsaasProvider,
  ) {}

  // =========================================================================
  // CHECKOUT DE ASSINATURA RECORRENTE
  // =========================================================================
  async checkout(companyId: string, dto: CheckoutSubscriptionDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plano não encontrado ou indisponível');
    }

    // Determinar valor oficial com base no ciclo
    const amount =
      dto.billingCycle === BillingCycle.YEARLY
        ? plan.priceYearly
        : plan.priceMonthly;

    // 1. Criar ou recuperar cliente no Asaas
    const customer = await this.asaasProvider.createOrGetCustomer({
      name: company.name,
      email: company.email,
      phone: company.phone,
      cpfCnpj: dto.cpfCnpj || company.document || undefined,
    });

    // 2. Criar assinatura no Asaas
    const dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const asaasBillingType =
      dto.paymentMethod === PaymentMethod.PIX
        ? 'PIX'
        : dto.paymentMethod === PaymentMethod.BOLETO
        ? 'BOLETO'
        : 'CREDIT_CARD';

    const asaasSub = await this.asaasProvider.createSubscription({
      customer: customer.id,
      billingType: asaasBillingType,
      value: Number(amount),
      nextDueDate: dueDate,
      cycle: dto.billingCycle === BillingCycle.YEARLY ? 'YEARLY' : 'MONTHLY',
      description: `Assinatura Plano ${plan.name} - ${company.name}`,
    });

    const currentPeriodStart = new Date();
    const currentPeriodEnd =
      dto.billingCycle === BillingCycle.YEARLY
        ? addYears(currentPeriodStart, 1)
        : addMonths(currentPeriodStart, 1);

    // 3. Salvar ou atualizar assinatura no banco de dados
    const subscription = await this.prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId: plan.id,
        provider: 'ASAAS',
        providerCustomerId: customer.id,
        providerSubscriptionId: asaasSub.id,
        status: SubscriptionStatus.ACTIVE, // Em sandbox ativa imediatamente para testes
        billingCycle: dto.billingCycle,
        amount,
        nextDueDate: new Date(dueDate),
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        companyId,
        planId: plan.id,
        provider: 'ASAAS',
        providerCustomerId: customer.id,
        providerSubscriptionId: asaasSub.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: dto.billingCycle,
        amount,
        nextDueDate: new Date(dueDate),
        currentPeriodStart,
        currentPeriodEnd,
      },
      include: {
        plan: true,
      },
    });

    // 4. Criar registro de pagamento inicial
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        subscriptionId: subscription.id,
        providerPaymentId: asaasSub.firstPaymentId || `pay_${Date.now()}`,
        amount,
        status: PaymentStatus.CONFIRMED,
        paymentMethod: dto.paymentMethod,
        dueDate: new Date(dueDate),
        paidAt: new Date(),
        invoiceUrl: asaasSub.paymentUrl || null,
      },
    });

    return {
      success: true,
      message: 'Assinatura contratada com sucesso!',
      subscription,
      payment,
      paymentUrl: asaasSub.paymentUrl,
    };
  }

  // =========================================================================
  // GET /api/subscriptions/me (CONSULTA E VALIDAÇÃO DE ACESSO)
  // =========================================================================
  async getMe(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const sub = company.subscription;
    if (!sub) {
      return {
        companyId,
        subscription: null,
        access: {
          hasActiveSubscription: false,
          isExpired: true,
          canUseSystem: false,
        },
      };
    }

    const now = new Date();
    const isActive =
      sub.status === SubscriptionStatus.ACTIVE && sub.currentPeriodEnd > now;
    const isTrial =
      sub.status === SubscriptionStatus.TRIALING &&
      (!sub.trialEndsAt || sub.trialEndsAt > now);

    const canUseSystem = (isActive || isTrial) && company.isActive;

    return {
      companyId,
      subscription: {
        id: sub.id,
        status: sub.status,
        plan: {
          id: sub.plan.id,
          name: sub.plan.name,
          slug: sub.plan.slug,
          features: sub.plan.features,
        },
        billingCycle: sub.billingCycle,
        amount: sub.amount,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
      },
      access: {
        hasActiveSubscription: isActive || isTrial,
        isExpired: !isActive && !isTrial,
        canUseSystem,
      },
    };
  }

  // =========================================================================
  // GET /api/subscriptions/me/features (RECURSOS E LIMITES DO PLANO)
  // =========================================================================
  async getFeatures(companyId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!sub) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada');
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [professionalsCount, appointmentsMonthCount] = await Promise.all([
      this.prisma.professional.count({
        where: { companyId, isActive: true },
      }),
      this.prisma.appointment.count({
        where: {
          companyId,
          createdAt: { gte: startOfMonth },
          status: { not: 'CANCELLED' },
        },
      }),
    ]);

    const featuresObj = (sub.plan.features as Record<string, any>) || {};

    return {
      plan: sub.plan.slug.toUpperCase(),
      subscriptionStatus: sub.status,
      features: {
        maxProfessionals: sub.plan.maxProfessionals,
        maxAppointments: sub.plan.maxAppointmentsPerMonth,
        maxWhatsappMessages: sub.plan.maxWhatsappMessages,
        whatsappNotifications: Boolean(featuresObj.whatsappNotifications),
        customBranding: Boolean(featuresObj.customBranding),
        advancedReports: Boolean(featuresObj.advancedReports),
        products: Boolean(featuresObj.products),
      },
      usage: {
        currentProfessionals: professionalsCount,
        currentAppointmentsThisMonth: appointmentsMonthCount,
      },
    };
  }

  async cancelSubscription(companyId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!sub) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (sub.providerSubscriptionId) {
      await this.asaasProvider.cancelSubscription(sub.providerSubscriptionId);
    }

    return this.prisma.subscription.update({
      where: { companyId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });
  }
}

