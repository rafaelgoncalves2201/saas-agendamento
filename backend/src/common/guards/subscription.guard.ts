import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { Role, SubscriptionStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Deixa o JwtAuthGuard cuidar da autenticação
    }

    // Super Admin tem bypass irrestrito
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    const companyId = request.companyId || user.companyId;
    if (!companyId) {
      return true;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Payment Required',
          message: 'Nenhuma assinatura encontrada para a sua empresa. Por favor, selecione um plano.',
          code: 'NO_SUBSCRIPTION',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const now = new Date();

    // 1. Assinatura ativa ou trialing válido
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      if (now > subscription.currentPeriodEnd) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            error: 'Payment Required',
            message: 'O período da sua assinatura expirou. Regularize o pagamento para continuar utilizando o sistema.',
            code: 'SUBSCRIPTION_EXPIRED',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      return true;
    }

    if (subscription.status === SubscriptionStatus.TRIALING) {
      if (subscription.trialEndsAt && now > subscription.trialEndsAt) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            error: 'Payment Required',
            message: 'Seu período de teste gratuito de 14 dias expirou. Assine um plano para continuar.',
            code: 'TRIAL_EXPIRED',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      return true;
    }

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Payment Required',
          message: 'Sua assinatura está com pagamento pendente/em atraso. Por favor, regularize a fatura para liberar o acesso.',
          code: 'SUBSCRIPTION_PAST_DUE',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (subscription.status === SubscriptionStatus.SUSPENDED) {
      throw new ForbiddenException('O acesso da sua empresa foi suspenso pela administração da plataforma.');
    }

    if (subscription.status === SubscriptionStatus.CANCELED || subscription.status === SubscriptionStatus.EXPIRED) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Payment Required',
          message: 'Sua assinatura foi cancelada ou expirou. Reative seu plano para continuar operando.',
          code: 'SUBSCRIPTION_INACTIVE',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}

