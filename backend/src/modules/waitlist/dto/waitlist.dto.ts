import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaitlistStatus } from '@prisma/client';

export class CreateWaitlistEntryDto {
  @ApiProperty({ description: 'Nome completo do cliente' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ description: 'WhatsApp ou celular do cliente' })
  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @ApiPropertyOptional({ description: 'E-mail do cliente' })
  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @ApiPropertyOptional({ description: 'ID do serviço desejado' })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID do profissional preferido' })
  @IsString()
  @IsOptional()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'Data de preferência (ISO string)' })
  @IsString()
  @IsOptional()
  preferredDate?: string;

  @ApiPropertyOptional({ description: 'Período preferido: MANHA, TARDE, NOITE, QUALQUER' })
  @IsString()
  @IsOptional()
  preferredPeriod?: string;

  @ApiPropertyOptional({ description: 'Observações adicionais ou restrições de horário' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateWaitlistStatusDto {
  @ApiProperty({ enum: WaitlistStatus })
  @IsEnum(WaitlistStatus)
  status: WaitlistStatus;
}

