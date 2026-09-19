import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'VERAO10' })
  @IsString()
  @IsNotEmpty({ message: 'O código do cupom é obrigatório' })
  code: string;

  @ApiProperty({ example: 'Desconto especial de verão', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 10, description: '10 para 10% ou 20 para R$ 20' })
  @IsNumber()
  @IsPositive({ message: 'O valor do desconto deve ser maior que zero' })
  discountValue: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({ example: 100, required: false, description: 'Limite de utilizações' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ example: 'uuid-do-profissional', required: false })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @ApiProperty({ example: 'VERAO10', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Desconto especial de verão', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE, required: false })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'O valor do desconto deve ser maior que zero' })
  discountValue?: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ example: 'uuid-do-profissional', required: false })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'VERAO10' })
  @IsString()
  @IsNotEmpty({ message: 'Código do cupom é obrigatório' })
  code: string;

  @ApiProperty({ example: 'uuid-service-id' })
  @IsString()
  @IsNotEmpty({ message: 'Serviço é obrigatório' })
  serviceId: string;

  @ApiProperty({ example: 'uuid-professional-id' })
  @IsString()
  @IsNotEmpty({ message: 'Profissional é obrigatório' })
  professionalId: string;
}

