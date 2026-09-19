import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Enterprise' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'enterprise' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Para grandes clínicas e redes' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 199.9 })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiProperty({ example: 1999.0 })
  @IsNumber()
  @Min(0)
  priceYearly: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  maxProfessionals: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(1)
  maxAppointmentsPerMonth: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  maxWhatsappMessages: number;

  @ApiProperty({ example: { whatsappNotifications: true, customBranding: true, advancedReports: true, products: true } })
  @IsObject()
  features: Record<string, any>;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdatePlanDto {
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
  priceMonthly?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priceYearly?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxProfessionals?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxAppointmentsPerMonth?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxWhatsappMessages?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

