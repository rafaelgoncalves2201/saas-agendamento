import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ description: 'Nota de avaliação de 1 a 5 estrelas', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário ou depoimento do cliente' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'WhatsApp ou telefone para conferência' })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'ID do serviço avaliado' })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID do profissional avaliado' })
  @IsString()
  @IsOptional()
  professionalId?: string;
}

export class SubmitAppointmentReviewDto {
  @ApiProperty({ description: 'Nota de avaliação de 1 a 5 estrelas', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário ou depoimento do cliente' })
  @IsString()
  @IsOptional()
  comment?: string;
}

