import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de Cabelo Masculino' })
  @IsString()
  @IsNotEmpty({ message: 'O nome do serviço é obrigatório' })
  name: string;

  @ApiProperty({ example: 'Corte com acabamento na navalha e lavagem especial', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45, description: 'Duração em minutos' })
  @IsNumber()
  @Min(5, { message: 'A duração mínima é de 5 minutos' })
  durationMinutes: number;

  @ApiProperty({ example: 60.0, description: 'Preço em Reais' })
  @IsNumber()
  @Min(0, { message: 'O preço não pode ser negativo' })
  price: number;

  @ApiProperty({ example: 'Cabelo', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-haircut.png', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: ['uuid-professional-1'], required: false, description: 'IDs dos profissionais associados' })
  @IsOptional()
  @IsArray()
  professionalIds?: string[];

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateServiceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  professionalIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

