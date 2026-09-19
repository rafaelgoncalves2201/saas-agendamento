import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Endpoint público para recepção de webhooks do Asaas' })
  @ApiHeader({
    name: 'asaas-access-token',
    description: 'Token de autenticação do webhook configurado no Asaas',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook recebido e processado' })
  @ApiResponse({ status: 401, description: 'Token de webhook inválido' })
  handlePaymentWebhook(
    @Headers('asaas-access-token') token: string,
    @Body() payload: any,
  ) {
    return this.webhooksService.processAsaasWebhook(token, payload);
  }
}

