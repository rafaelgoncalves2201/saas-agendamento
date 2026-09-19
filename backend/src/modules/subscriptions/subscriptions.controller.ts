import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CheckoutSubscriptionDto } from './dto/checkout.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('checkout')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Contratar ou alterar plano com checkout integrado Asaas' })
  @ApiResponse({ status: 201, description: 'Assinatura criada com sucesso' })
  checkout(@Req() req: any, @Body() dto: CheckoutSubscriptionDto) {
    return this.subscriptionsService.checkout(req.companyId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Consultar status da assinatura e autorização de acesso da empresa' })
  @ApiResponse({ status: 200, description: 'Estado atual da assinatura e flags de acesso' })
  getMe(@Req() req: any) {
    return this.subscriptionsService.getMe(req.companyId);
  }

  @Get('me/features')
  @ApiOperation({ summary: 'Consultar recursos habilitados e uso dos limites do plano' })
  getFeatures(@Req() req: any) {
    return this.subscriptionsService.getFeatures(req.companyId);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Solicitar cancelamento da assinatura ao final do período vigente' })
  cancelSubscription(@Req() req: any) {
    return this.subscriptionsService.cancelSubscription(req.companyId);
  }
}

