import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateDepositSettingsDto } from './dto/mercadopago.dto';
import { AppointmentStatus, DepositType, Prisma } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(private prisma: PrismaService) {}

  // 1. Gera URL oficial do OAuth do Mercado Pago (para profissional ou estabelecimento)
  getAuthorizationUrl(
    targetId: string,
    companyId: string,
    isCompany = false,
  ): { url: string; authUrl: string } {
    const clientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const redirectUri =
      process.env.MERCADO_PAGO_REDIRECT_URI || `${apiUrl}/api/mercadopago/callback`;

    // Codifica state com segurança para identificar se é do profissional ou do estabelecimento (Admin)
    const statePayload = {
      type: isCompany ? 'company' : 'professional',
      targetId,
      companyId,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    // Se estiver em modo simulado/sem credenciais reais, redireciona direto para o callback de simulação
    const isMock = !clientId || clientId.includes('PLACEHOLDER');
    const authUrl = isMock
      ? `${apiUrl}/api/mercadopago/callback?code=mock_code_${Date.now()}&state=${state}`
      : `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(
          redirectUri,
        )}`;

    return { url: authUrl, authUrl };
  }

  // 2. Callback OAuth: troca do código de autorização por Access Token
  async handleOAuthCallback(code: string, state: string): Promise<string> {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    let type = 'professional';
    let targetId: string;
    let companyId: string;

    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      type = decoded.type || 'professional';
      targetId = decoded.targetId || decoded.professionalId;
      companyId = decoded.companyId;
    } catch {
      throw new BadRequestException('State de autenticação inválido ou corrompido');
    }

    const isCompany = type === 'company';
    const redirectSuccess = isCompany
      ? `${appUrl}/settings?mp_connected=true`
      : `${appUrl}/professionals?mp_connected=true`;
    const redirectError = isCompany
      ? `${appUrl}/settings?mp_error=true`
      : `${appUrl}/professionals?mp_error=true`;

    const clientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET;
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const redirectUri =
      process.env.MERCADO_PAGO_REDIRECT_URI || `${apiUrl}/api/mercadopago/callback`;

    // Se estiver em modo de teste/simulação e não houver credenciais reais configuradas
    if (!clientId || !clientSecret || clientId.includes('PLACEHOLDER')) {
      this.logger.warn(
        'Mercado Pago Client ID ou Secret não configurados. Ativando em modo de teste.',
      );

      const mockTokens = {
        mpAccessToken: `TEST_ACCESS_TOKEN_${Date.now()}`,
        mpRefreshToken: `TEST_REFRESH_TOKEN_${Date.now()}`,
        mpUserId: `mp_user_${Date.now()}`,
        mpExpiresIn: 15552000,
        mpTokenType: 'bearer',
        mpPublicKey: `TEST_PUBLIC_KEY_${Date.now()}`,
      };

      if (isCompany) {
        await this.prisma.company.update({
          where: { id: companyId },
          data: mockTokens,
        });
      } else {
        await this.prisma.professional.update({
          where: { id: targetId },
          data: mockTokens,
        });
      }
      return redirectSuccess;
    }

    try {
      const tokenResponse = await axios.post(
        'https://api.mercadopago.com/oauth/token',
        {
          client_secret: clientSecret,
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = tokenResponse.data;
      const tokensToSave = {
        mpAccessToken: data.access_token,
        mpRefreshToken: data.refresh_token,
        mpUserId: String(data.user_id),
        mpExpiresIn: data.expires_in,
        mpTokenType: data.token_type,
        mpPublicKey: data.public_key,
      };

      if (isCompany) {
        await this.prisma.company.update({
          where: { id: companyId },
          data: tokensToSave,
        });
        this.logger.log(`Conta Mercado Pago do Estabelecimento conectada com sucesso (Empresa ID: ${companyId})`);
      } else {
        await this.prisma.professional.update({
          where: { id: targetId },
          data: tokensToSave,
        });
        this.logger.log(`Conta Mercado Pago conectada com sucesso para: ID ${targetId}`);
      }

      return redirectSuccess;
    } catch (err: any) {
      this.logger.error('Erro na troca de código do Mercado Pago:', err.response?.data || err.message);
      return redirectError;
    }
  }

  // 3. Desconectar conta do Mercado Pago do Estabelecimento (Admin)
  async disconnectCompany(companyId: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        mpAccessToken: null,
        mpRefreshToken: null,
        mpUserId: null,
        mpExpiresIn: null,
        mpTokenType: null,
        mpPublicKey: null,
      },
    });
  }

  // Obter status da conta Mercado Pago do Estabelecimento (Admin)
  async getCompanyMpStatus(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { mpAccessToken: true, mpUserId: true },
    });
    return {
      isConnected: Boolean(company?.mpAccessToken),
      mpUserId: company?.mpUserId || null,
    };
  }

  // 3. Desconectar conta do Mercado Pago
  async disconnect(professionalId: string, companyId: string) {
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, companyId },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    return this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        mpAccessToken: null,
        mpRefreshToken: null,
        mpUserId: null,
        mpExpiresIn: null,
        mpTokenType: null,
        mpPublicKey: null,
        requiresDeposit: false,
      },
    });
  }

  // 4. Salvar configurações de cobrança de sinal
  async updateDepositSettings(
    professionalId: string,
    companyId: string,
    dto: UpdateDepositSettingsDto,
  ) {
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, companyId },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    return this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        requiresDeposit: dto.requiresDeposit,
        depositType: dto.depositType || DepositType.FIXED,
        depositValue:
          dto.depositValue !== undefined && dto.depositValue !== null
            ? new Prisma.Decimal(dto.depositValue)
            : null,
      },
    });
  }

  // 5. Gerar Cobrança Pix no Mercado Pago com a conta do profissional
  async createPixPayment(params: {
    professionalAccessToken: string;
    appointmentId: string;
    amount: number;
    payerEmail?: string;
    payerName: string;
    serviceName: string;
    companyName: string;
  }): Promise<{
    mpPaymentId: string;
    pixCopiaECola: string;
    pixQrCodeBase64: string;
    pixPaymentUrl?: string;
  }> {
    const {
      professionalAccessToken,
      appointmentId,
      amount,
      payerEmail,
      payerName,
      serviceName,
      companyName,
    } = params;

    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const notificationUrl = `${apiUrl}/api/webhooks/mercadopago`;

    // Se estiver em modo de teste simulado
    if (professionalAccessToken.startsWith('TEST_')) {
      const mockPaymentId = `mp_pay_${Date.now()}`;
      const mockQrCode = `00020126580014br.gov.bcb.pix0136test-inova-agenda-mock-pix-copia-e-cola-520400005303986540${amount.toFixed(
        2,
      )}5802BR5913Inova Agenda6009SAO PAULO62070503***6304MOCK`;
      const mockQrCodeBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      return {
        mpPaymentId: mockPaymentId,
        pixCopiaECola: mockQrCode,
        pixQrCodeBase64: mockQrCodeBase64,
        pixPaymentUrl: `https://www.mercadopago.com.br/payments/${mockPaymentId}/ticket`,
      };
    }

    try {
      const response = await axios.post(
        'https://api.mercadopago.com/v1/payments',
        {
          transaction_amount: Number(amount.toFixed(2)),
          description: `Sinal - ${serviceName} (${companyName})`,
          payment_method_id: 'pix',
          payer: {
            email: payerEmail || 'cliente@inovaagenda.com',
            first_name: payerName ? payerName.split(' ')[0] : 'Cliente',
            last_name: payerName && payerName.split(' ').length > 1 ? payerName.split(' ').slice(1).join(' ') : 'Cliente',
          },
          notification_url: notificationUrl,
          external_reference: appointmentId,
        },
        {
          headers: {
            Authorization: `Bearer ${professionalAccessToken}`,
            'X-Idempotency-Key': appointmentId,
            'Content-Type': 'application/json',
          },
        },
      );

      const paymentData = response.data;
      const pointOfInteraction = paymentData.point_of_interaction?.transaction_data;

      return {
        mpPaymentId: String(paymentData.id),
        pixCopiaECola: pointOfInteraction?.qr_code || '',
        pixQrCodeBase64: pointOfInteraction?.qr_code_base64 || '',
        pixPaymentUrl: pointOfInteraction?.ticket_url || '',
      };
    } catch (err: any) {
      this.logger.error('Erro ao gerar Pix no Mercado Pago:', err.response?.data || err.message);
      throw new InternalServerErrorException(
        err.response?.data?.message || 'Falha ao gerar cobrança Pix via Mercado Pago',
      );
    }
  }

  // 6. Consultar pagamento diretamente no Mercado Pago
  async getPayment(paymentId: string, professionalAccessToken: string) {
    if (professionalAccessToken.startsWith('TEST_')) {
      return {
        id: paymentId,
        status: 'approved',
        status_detail: 'accredited',
      };
    }

    try {
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${professionalAccessToken}`,
        },
      });
      return response.data;
    } catch (err: any) {
      this.logger.error(`Erro ao consultar pagamento MP ${paymentId}:`, err.response?.data || err.message);
      return null;
    }
  }

  // 7. Processamento do Webhook do Mercado Pago
  async processWebhook(payload: any, query: any) {
    const paymentId =
      payload?.data?.id || query?.id || query?.['data.id'] || (payload?.type === 'payment' ? payload?.id : null);

    if (!paymentId) {
      return { status: 'IGNORED', message: 'Notificação não é de pagamento' };
    }

    this.logger.log(`📥 Webhook Mercado Pago recebido para pagamento: ${paymentId}`);

    // Localizar agendamento vinculado
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        OR: [
          { mpPaymentId: String(paymentId) },
          { id: payload?.external_reference },
        ],
      },
      include: {
        professional: true,
        company: true,
      },
    });

    if (!appointment) {
      this.logger.warn(`Nenhum agendamento encontrado para pagamento MP ID: ${paymentId}`);
      return { status: 'NOT_FOUND' };
    }

    // Se já está confirmado, nada a fazer
    if (appointment.status === AppointmentStatus.CONFIRMED) {
      return { status: 'ALREADY_CONFIRMED' };
    }

    const accessToken =
      appointment.professional?.mpAccessToken || appointment.company?.mpAccessToken;
    if (!accessToken) {
      this.logger.warn(
        `Agendamento ${appointment.id} não possui mpAccessToken de profissional nem de empresa`,
      );
      return { status: 'NO_TOKEN' };
    }

    // Consulta status oficial no Mercado Pago
    const mpPayment = await this.getPayment(String(paymentId), accessToken);

    if (mpPayment && (mpPayment.status === 'approved' || mpPayment.status_detail === 'accredited')) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: AppointmentStatus.CONFIRMED,
          paidAt: new Date(),
        },
      });

      this.logger.log(`✅ Agendamento ${appointment.id} CONFIRMADO com sucesso via Mercado Pago!`);
      return { status: 'CONFIRMED', appointmentId: appointment.id };
    }

    return { status: 'PENDING_OR_OTHER', currentStatus: mpPayment?.status };
  }
}

