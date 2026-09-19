import { Global, Module } from '@nestjs/common';
import { WhatsAppProvider } from './whatsapp.provider';
import { WhatsAppService } from './whatsapp.service';

@Global()
@Module({
  providers: [WhatsAppProvider, WhatsAppService],
  exports: [WhatsAppProvider, WhatsAppService],
})
export class WhatsAppModule {}

