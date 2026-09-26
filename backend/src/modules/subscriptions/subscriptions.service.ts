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
import { getPlanConfig } from '../../common/config/plans.config';

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

    const currentSub = await this.prisma.subscription.findUnique({
      where: { companyId },
    });

    // Ao contratar um plano oficial, a assinatura entra em INCOMPLETE (aguardando pagamento).
    // O período de teste gratuito (TRIAL) é apenas para o cadastro inicial e é encerrado na contratação de um plano.
    const initialStatus = SubscriptionStatus.INCOMPLETE;

    // 3. Salvar ou atualizar assinatura no banco de dados
    const subscription = await this.prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId: plan.id,
        provider: 'ASAAS',
        providerCustomerId: customer.id,
        providerSubscriptionId: asaasSub.id,
        status: initialStatus,
        billingCycle: dto.billingCycle,
        amount,
        nextDueDate: new Date(dueDate),
        currentPeriodStart,
        currentPeriodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
      },
      create: {
        companyId,
        planId: plan.id,
        provider: 'ASAAS',
        providerCustomerId: customer.id,
        providerSubscriptionId: asaasSub.id,
        status: initialStatus,
        billingCycle: dto.billingCycle,
        amount,
        nextDueDate: new Date(dueDate),
        currentPeriodStart,
        currentPeriodEnd,
        trialEndsAt: null,
      },
      include: {
        plan: true,
      },
    });

    // 4. Criar registro de pagamento inicial com status PENDING (aguardando pagamento)
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        subscriptionId: subscription.id,
        providerPaymentId: asaasSub.firstPaymentId || `pay_${Date.now()}`,
        amount,
        status: PaymentStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        dueDate: new Date(dueDate),
        paidAt: null,
        invoiceUrl: asaasSub.paymentUrl || null,
      },
    });

    return {
      success: true,
      message: 'Cobrança gerada com sucesso! Aguardando compensação do pagamento.',
      subscription,
      payment,
      paymentUrl: asaasSub.paymentUrl,
      pixQrCode: asaasSub.pixQrCode,
    };
  }

  // =========================================================================
  // GET /api/subscriptions/me (CONSULTA E VALIDAÇÃO DE ACESSO)
  // =========================================================================
  async getMe(companyId?: string) {
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      } else {
        return {
          companyId: null,
          subscription: null,
          access: {
            hasActiveSubscription: true,
            isExpired: false,
            canUseSystem: true,
          },
        };
      }
    }

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
      return {
        companyId,
        subscription: null,
        access: {
          hasActiveSubscription: true,
          isExpired: false,
          canUseSystem: true,
        },
      };
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
  async getFeatures(companyId?: string) {
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      }
    }

    const sub = companyId
      ? await this.prisma.subscription.findUnique({
          where: { companyId },
          include: { plan: true },
        })
      : null;

    if (!sub) {
      return {
        plan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        features: {
          maxProfessionals: 999,
          maxAppointments: 9999,
          maxWhatsappMessages: 9999,
          whatsappNotifications: true,
          customBranding: true,
          advancedReports: true,
          products: true,
        },
        usage: {
          currentProfessionals: 0,
          currentAppointmentsThisMonth: 0,
        },
      };
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
    const planConfig = getPlanConfig(sub.plan.slug);

    return {
      plan: planConfig.tier,
      planName: planConfig.name,
      planSlug: planConfig.slug,
      subscriptionStatus: sub.status,
      features: {
        maxProfessionals: planConfig.maxProfessionals,
        maxAppointments: planConfig.maxAppointmentsPerMonth,
        maxWhatsappMessages: planConfig.maxWhatsappMessages,
        whatsappNotifications: true,
        mercadopago: planConfig.features.mercadopago,
        onlinePayment: planConfig.features.onlinePayment,
        pixSignal: planConfig.features.pixSignal,
        inventory: planConfig.features.inventory,
        inventoryControl: planConfig.features.inventoryControl,
        products: planConfig.features.products,
        customBranding: Boolean(featuresObj.customBranding || planConfig.features.customBranding),
        advancedReports: Boolean(featuresObj.advancedReports || planConfig.features.advancedReports),
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

  // =========================================================================
  // SINCRONIZAÇÃO ATIVA COM O ASAAS (CONSULTA DIRETA À API)
  // Garante a ativação mesmo se o Webhook não estiver configurado!
  // =========================================================================
  async syncSubscription(companyId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!sub || !sub.providerSubscriptionId) {
      throw new NotFoundException('Nenhuma assinatura Asaas vinculada a esta empresa');
    }

    // 1. Consulta faturas da assinatura diretamente na API oficial do Asaas
    const payments = await this.asaasProvider.getSubscriptionPayments(sub.providerSubscriptionId);

    // 2. Procura pagamento compensado/recebido
    const confirmedPayment = payments.find(
      (p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED',
    );

    if (confirmedPayment) {
      const nextPeriodEnd =
        sub.billingCycle === BillingCycle.YEARLY
          ? addYears(new Date(), 1)
          : addMonths(new Date(), 1);

      // Ativar a assinatura no banco de dados local
      const updatedSub = await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextPeriodEnd,
        },
        include: { plan: true },
      });

      // Atualizar status do pagamento
      await this.prisma.payment.upsert({
        where: { providerPaymentId: confirmedPayment.id },
        update: {
          status: PaymentStatus.CONFIRMED,
          paidAt: confirmedPayment.clientPaymentDate
            ? new Date(confirmedPayment.clientPaymentDate)
            : new Date(),
        },
        create: {
          companyId,
          subscriptionId: sub.id,
          providerPaymentId: confirmedPayment.id,
          amount: confirmedPayment.value,
          status: PaymentStatus.CONFIRMED,
          paymentMethod:
            confirmedPayment.billingType === 'PIX'
              ? PaymentMethod.PIX
              : PaymentMethod.CREDIT_CARD,
          dueDate: new Date(confirmedPayment.dueDate),
          paidAt: new Date(),
          invoiceUrl: confirmedPayment.invoiceUrl || null,
        },
      });

      return {
        synced: true,
        active: true,
        message: 'Pagamento confirmado pelo banco! Seu plano está 100% ativado.',
        subscription: updatedSub,
      };
    }

    // Se ainda não consta como recebido no Asaas
    const latestPayment = payments[0] || null;
    let pixQrCode = null;
    if (latestPayment && latestPayment.billingType === 'PIX' && latestPayment.id) {
      pixQrCode = await this.asaasProvider.getPixQrCode(latestPayment.id);
    }

    return {
      synced: true,
      active: sub.status === SubscriptionStatus.ACTIVE,
      message: 'Pagamento ainda não identificado pelo banco. Se realizou via Pix agora, aguarde até 30 segundos e verifique novamente.',
      subscription: sub,
      latestPayment: latestPayment
        ? {
            id: latestPayment.id,
            status: latestPayment.status,
            value: latestPayment.value,
            invoiceUrl: latestPayment.invoiceUrl,
            pixQrCode,
          }
        : null,
    };
  }
}

