import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @ApiProperty({ required: false, example: 'Studio Beleza Pura VIP' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: '11999998888' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'contato@belezapura.com.br' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false, example: '12.345.678/0001-90' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ required: false, example: 'https://images.unsplash.com/photo-logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, example: 'https://images.unsplash.com/photo-cover.png' })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({
    required: false,
    example: {
      timezone: 'America/Sao_Paulo',
      minBookingNoticeMinutes: 60,
      maxBookingFutureDays: 30,
      cancellationPolicyHours: 2,
      primaryColor: '#6366f1',
      welcomeMessage: 'Bem-vindo ao nosso espaço de beleza e bem-estar!',
    },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

