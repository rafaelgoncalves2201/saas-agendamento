import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MercadoPagoService } from './mercadopago.service';
import { UpdateDepositSettingsDto } from './dto/mercadopago.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';

@ApiTags('Mercado Pago (Sinal & Pix)')
@Controller()
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  // 1. Iniciar conexão OAuth para um profissional
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @RequireFeature('mercadopago')
  @Get('mercadopago/connect/:professionalId')
  @ApiOperation({ summary: 'Obter URL de autorização OAuth do Mercado Pago para o profissional' })
  getConnectUrl(@Param('professionalId') professionalId: string, @Req() req: any) {
    return this.mercadoPagoService.getAuthorizationUrl(professionalId, req.companyId, false);
  }

  // 1b. Iniciar conexão OAuth para o Estabelecimento / Administrador
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @RequireFeature('mercadopago')
  @Get('mercadopago/company-connect')
  @ApiOperation({ summary: 'Obter URL de autorização OAuth do Mercado Pago para a Empresa/Admin' })
  getCompanyConnectUrl(@Req() req: any) {
    return this.mercadoPagoService.getAuthorizationUrl('', req.companyId, true);
  }

  // 1c. Desconectar conta do Estabelecimento / Administrador
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @RequireFeature('mercadopago')
  @Post('mercadopago/company-disconnect')
  @ApiOperation({ summary: 'Desconectar conta Mercado Pago do Estabelecimento/Admin' })
  disconnectCompany(@Req() req: any) {
    return this.mercadoPagoService.disconnectCompany(req.companyId);
  }

  // 1d. Status de conexão da conta do Estabelecimento
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @RequireFeature('mercadopago')
  @Get('mercadopago/company-status')
  @ApiOperation({ summary: 'Verificar status da conta Mercado Pago do Estabelecimento' })
  getCompanyMpStatus(@Req() req: any) {
    return this.mercadoPagoService.getCompanyMpStatus(req.companyId);
  }

  // 2. Callback público do OAuth do Mercado Pago
  @Public()
  @Get('mercadopago/callback')
  @ApiOperation({ summary: 'Callback oficial do Mercado Pago para troca de tokens OAuth' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.mercadoPagoService.handleOAuthCallback(code, state);
    return res.redirect(redirectUrl);
  }

  // 3. Desconectar conta do Mercado Pago do profissional
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @RequireFeature('mercadopago')
  @Post('mercadopago/disconnect/:professionalId')
  @ApiOperation({ summary: 'Desconectar conta Mercado Pago do profissional' })
  disconnect(@Param('professionalId') professionalId: string, @Req() req: any) {
    return this.mercadoPagoService.disconnect(professionalId, req.companyId);
  }

  // 4. Salvar configurações de cobrança de sinal do profissional
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @RequireFeature('mercadopago')
  @Patch('mercadopago/deposit-settings/:professionalId')
  @ApiOperation({ summary: 'Atualizar configurações de sinal (fixo/percentual) do profissional' })
  updateDepositSettings(
    @Param('professionalId') professionalId: string,
    @Body() dto: UpdateDepositSettingsDto,
    @Req() req: any,
  ) {
    return this.mercadoPagoService.updateDepositSettings(professionalId, req.companyId, dto);
  }

  // 5. Webhook público de confirmação instantânea de pagamentos
  @Public()
  @Post('webhooks/mercadopago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook oficial do Mercado Pago para notificação de pagamentos Pix' })
  async handleWebhook(@Body() payload: any, @Query() query: any) {
    return this.mercadoPagoService.processWebhook(payload, query);
  }
}

