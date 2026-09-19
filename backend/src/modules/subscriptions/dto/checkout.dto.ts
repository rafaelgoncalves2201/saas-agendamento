import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BillingCycle, PaymentMethod } from '@prisma/client';

export class CheckoutSubscriptionDto {
  @ApiProperty({ example: 'uuid-plan-id' })
  @IsString()
  @IsNotEmpty({ message: 'O ID do plano é obrigatório' })
  planId: string;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PIX })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false, description: 'CPF ou CNPJ para emissão no Asaas' })
  @IsOptional()
  @IsString()
  cpfCnpj?: string;
}

