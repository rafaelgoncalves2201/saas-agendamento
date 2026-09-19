import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Carlos Barbeiro' })
  @IsString()
  @IsNotEmpty({ message: 'O nome do profissional é obrigatório' })
  name: string;

  @ApiProperty({ example: 'carlos-barbeiro', description: 'Identificador único do profissional para link público' })
  @IsString()
  @IsNotEmpty({ message: 'O slug é obrigatório' })
  slug: string;

  @ApiProperty({ example: 'carlos@empresa.com', required: false })
  @IsOptional()
  @ValidateIf((o) => typeof o.email === 'string' && o.email.trim().length > 0)
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  email?: string;

  @ApiProperty({ example: '11999990000', description: 'WhatsApp do profissional' })
  @IsString()
  @IsNotEmpty({ message: 'O telefone/WhatsApp é obrigatório' })
  phone: string;

  @ApiProperty({ example: 'Especialista em cortes modernos e barba alinhada', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-barber.png', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: ['uuid-service-1', 'uuid-service-2'], required: false })
  @IsOptional()
  @IsArray()
  serviceIds?: string[];
}

export class UpdateProfessionalDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateIf((o) => typeof o.email === 'string' && o.email.trim().length > 0)
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  serviceIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
