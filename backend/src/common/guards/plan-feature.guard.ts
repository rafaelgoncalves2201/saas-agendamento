import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { PlanFeatures, isPlanFeatureAllowed, getPlanConfig } from '../config/plans.config';
import { Role } from '@prisma/client';

const FEATURE_NAMES: Record<keyof PlanFeatures, string> = {
  mercadopago: 'Mercado Pago e pagamentos online',
  onlinePayment: 'Pagamentos online',
  pixSignal: 'Configuração e recebimento de sinal via Pix',
  inventory: 'Controle de Estoque e Insumos',
  inventoryControl: 'Controle de Estoque e Insumos',
  products: 'Cadastro e gestão de produtos',
  customBranding: 'Personalização avançada da marca',
  advancedReports: 'Relatórios avançados',
  scheduling: 'Sistema de agendamento',
  publicBookingPage: 'Página pública de agendamento',
  whatsappNotifications: 'Notificações via WhatsApp',
  whatsappAppointmentMessages: 'Mensagens de agendamento no WhatsApp',
};

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<keyof PlanFeatures>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super Admin tem bypass irrestrito
    if (user?.role === Role.SUPER_ADMIN) {
      return true;
    }

    const companyId = request.companyId || user?.companyId;
    if (!companyId) {
      return true;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!subscription || !subscription.plan) {
      throw new ForbiddenException(
        'Sua empresa não possui um plano ativo configurado. Por favor, selecione um plano para continuar.',
      );
    }

    const planSlug = subscription.plan.slug;
    const allowed = isPlanFeatureAllowed(planSlug, requiredFeature);

    if (!allowed) {
      const featureLabel = FEATURE_NAMES[requiredFeature] || requiredFeature;
      const currentPlanConfig = getPlanConfig(planSlug);

      throw new ForbiddenException(
        `O recurso "${featureLabel}" não está disponível no plano ${currentPlanConfig.name}. Faça upgrade para o plano Profissional ou Premium para desbloquear este recurso.`,
      );
    }

    return true;
  }
}

