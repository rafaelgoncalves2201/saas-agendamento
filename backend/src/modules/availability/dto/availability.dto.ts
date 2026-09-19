import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityItemDto {
  @ApiProperty({ example: 1, description: '0 = Domingo, 1 = Segunda ... 6 = Sábado' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: '12:00', required: false })
  @IsOptional()
  @IsString()
  breakStart?: string;

  @ApiProperty({ example: '13:00', required: false })
  @IsOptional()
  @IsString()
  breakEnd?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

export class SetAvailabilityDto {
  @ApiProperty({ required: false, description: 'ID do profissional (omitir para horário padrão da empresa)' })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ type: [AvailabilityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityItemDto)
  availabilities: AvailabilityItemDto[];
}

export class CreateBlockedTimeDto {
  @ApiProperty({ required: false, description: 'ID do profissional (omitir para bloqueio geral da empresa)' })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ example: '2026-09-25T14:00:00.000Z' })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({ example: '2026-09-25T16:00:00.000Z' })
  @IsDateString()
  endDateTime: string;

  @ApiProperty({ example: 'Consulta médica', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class QuerySlotsDto {
  @ApiProperty({ example: 'uuid-professional-id' })
  @IsString()
  @IsNotEmpty()
  professionalId: string;

  @ApiProperty({ example: 'uuid-service-id' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: '2026-09-25', description: 'Data no formato YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;
}

