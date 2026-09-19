import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { addMonths, addYears } from 'date-fns';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async processAsaasWebhook(tokenHeader: string | undefined, payload: any) {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN || 'asaas_secret_webhook_token_2026';

    // 1. Validação do token de segurança do webhook
    if (tokenHeader !== expectedToken) {
      this.logger.warn('Tentativa de envio de webhook com token inválido ou ausente');
      throw new UnauthorizedException('Token de webhook inválido');
    }

    const eventId = payload.id || `evt_${payload.event}_${payload.payment?.id || Date.now()}`;
    const eventType = payload.event;

    this.logger.log(`📥 Webhook recebido: ${eventType} (ID: ${eventId})`);

    // 2. Trava de Idempotência: verificar se este evento já foi processado
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { providerEventId: eventId },
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      this.logger.log(`Webhook ${eventId} já processado anteriormente. Ignorando reenvio.`);
      return { received: true, status: 'ALREADY_PROCESSED' };
    }

    // Registrar evento como RECEIVED
    await this.prisma.webhookEvent.upsert({
      where: { providerEventId: eventId },
      update: { payload },
      create: {
        provider: 'ASAAS',
        eventType,
        providerEventId: eventId,
        payload,
        status: 'RECEIVED',
      },
    });

    try {
      // 3. Processamento conforme tipo do evento
      const paymentData = payload.payment;
      const subscriptionId = paymentData?.subscription;

      if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
        if (subscriptionId) {
          // Localizar assinatura vinculada
          const subscription = await this.prisma.subscription.findFirst({
            where: { providerSubscriptionId: subscriptionId },
            include: { company: true },
          });

          if (subscription) {
            const nextPeriodEnd =
              subscription.billingCycle === 'YEARLY'
                ? addYears(new Date(), 1)
                : addMonths(new Date(), 1);

            // Ativar ou renovar a assinatura
            await this.prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: nextPeriodEnd,
              },
            });

            // Registrar ou atualizar o pagamento
            await this.prisma.payment.upsert({
              where: { providerPaymentId: paymentData.id },
              update: {
                status: PaymentStatus.CONFIRMED,
                paidAt: new Date(),
              },
              create: {
                companyId: subscription.companyId,
                subscriptionId: subscription.id,
                providerPaymentId: paymentData.id,
                amount: paymentData.value,
                status: PaymentStatus.CONFIRMED,
                paymentMethod: paymentData.billingType === 'PIX' ? 'PIX' : 'CREDIT_CARD',
                dueDate: new Date(paymentData.dueDate),
                paidAt: new Date(),
                invoiceUrl: paymentData.invoiceUrl || null,
              },
            });

            this.logger.log(
              `✅ Assinatura ativada/renovada com sucesso para empresa ${subscription.company.name}`,
            );
          }
        }
      } else if (eventType === 'PAYMENT_OVERDUE') {
        if (subscriptionId) {
          const subscription = await this.prisma.subscription.findFirst({
            where: { providerSubscriptionId: subscriptionId },
          });

          if (subscription) {
            await this.prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: SubscriptionStatus.PAST_DUE },
            });

            if (paymentData?.id) {
              await this.prisma.payment.updateMany({
                where: { providerPaymentId: paymentData.id },
                data: { status: PaymentStatus.FAILED },
              });
            }

            this.logger.warn(`⚠️ Assinatura marcada como PAST_DUE para a empresa ${subscription.companyId}`);
          }
        }
      } else if (eventType === 'SUBSCRIPTION_DELETED' || eventType === 'SUBSCRIPTION_CANCELLED') {
        if (payload.subscription?.id || subscriptionId) {
          const subProviderId = payload.subscription?.id || subscriptionId;
          await this.prisma.subscription.updateMany({
            where: { providerSubscriptionId: subProviderId },
            data: {
              status: SubscriptionStatus.CANCELED,
              canceledAt: new Date(),
            },
          });
          this.logger.log(`Assinatura ${subProviderId} cancelada via webhook.`);
        }
      }

      // Marcar evento como processado com sucesso
      await this.prisma.webhookEvent.update({
        where: { providerEventId: eventId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      return { received: true, status: 'PROCESSED' };
    } catch (err: any) {
      this.logger.error(`Erro ao processar webhook: ${err.message}`, err.stack);
      await this.prisma.webhookEvent.update({
        where: { providerEventId: eventId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
        },
      });
      throw err;
    }
  }
}

