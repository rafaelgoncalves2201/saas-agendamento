import { Module } from '@nestjs/common';
import { AsaasProvider } from './asaas.provider';

@Module({
  providers: [AsaasProvider],
  exports: [AsaasProvider],
})
export class PaymentsModule {}

