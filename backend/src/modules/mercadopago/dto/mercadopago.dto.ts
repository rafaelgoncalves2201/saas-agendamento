import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepositType } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateDepositSettingsDto {
  @ApiProperty({
    description: 'Se o profissional exige cobrança de sinal para confirmar agendamento',
    example: true,
  })
  @IsBoolean()
  requiresDeposit: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de cálculo do sinal (FIXED para valor em R$ ou PERCENTAGE para % do serviço)',
    enum: DepositType,
    default: DepositType.FIXED,
  })
  @IsOptional()
  @IsEnum(DepositType)
  depositType?: DepositType;

  @ApiPropertyOptional({
    description: 'Valor do sinal (ex: 20.00 para R$ 20, ou 30.00 para 30%)',
    example: 20.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  depositValue?: number;
}

export class ConnectAccessTokenDto {
  @ApiProperty({
    description: 'Access Token do Mercado Pago (APP_USR-... ou TEST-...)',
    example: 'APP_USR-1234567890-abcdef',
  })
  @IsString()
  @IsNotEmpty({ message: 'O Access Token do Mercado Pago é obrigatório' })
  accessToken: string;
}
