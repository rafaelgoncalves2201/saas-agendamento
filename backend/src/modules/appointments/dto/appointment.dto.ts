import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreatePublicAppointmentDto {
  @ApiProperty({ example: 'uuid-professional-id' })
  @IsString()
  @IsNotEmpty({ message: 'O profissional é obrigatório' })
  professionalId: string;

  @ApiProperty({ example: 'uuid-service-id' })
  @IsString()
  @IsNotEmpty({ message: 'O serviço é obrigatório' })
  serviceId: string;

  @ApiProperty({ example: '2026-09-25T14:00:00.000Z', description: 'Data e hora em UTC ISO' })
  @IsDateString({}, { message: 'Data/hora inválida' })
  startDateTime: string;

  @ApiProperty({ example: 'Mariana Lima' })
  @IsString()
  @IsNotEmpty({ message: 'Seu nome é obrigatório' })
  clientName: string;

  @ApiProperty({ example: '11988884444', description: 'WhatsApp com DDD' })
  @IsString()
  @IsNotEmpty({ message: 'Seu WhatsApp é obrigatório' })
  clientPhone: string;

  @ApiProperty({ example: 'mariana@gmail.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  clientEmail?: string;

  @ApiProperty({ example: 'Prefiro corte bem curto nas laterais', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'VERAO10', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.COMPLETED })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({ example: 'Cliente solicitou cancelamento por imprevisto', required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class CancelAppointmentClientDto {
  @ApiProperty({ example: 'Tive um imprevisto no trabalho', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

