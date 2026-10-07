import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterCompanyDto {
  @ApiProperty({ example: 'Inovae Agenda', description: 'Nome fantasia da empresa' })
  @IsString()
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
  companyName: string;

  @ApiProperty({ example: 'inovae-agenda', description: 'Slug único da empresa para link público' })
  @IsString()
  @IsNotEmpty({ message: 'O slug da empresa é obrigatório' })
  companySlug: string;

  @ApiProperty({ example: '11999998888', description: 'WhatsApp da empresa' })
  @IsString()
  @IsNotEmpty({ message: 'O telefone/WhatsApp da empresa é obrigatório' })
  companyPhone: string;

  @ApiProperty({ example: '12.345.678/0001-90', required: false, description: 'CNPJ ou CPF da empresa' })
  @IsOptional()
  @IsString()
  companyDocument?: string;

  @ApiProperty({ example: 'Administrador Inovae', description: 'Nome completo do proprietário' })
  @IsString()
  @IsNotEmpty({ message: 'O nome do proprietário é obrigatório' })
  ownerName: string;

  @ApiProperty({ example: 'contato@inovaeagenda.com.br', description: 'E-mail de acesso do proprietário' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  ownerEmail: string;

  @ApiProperty({ example: 'SenhaSegura@2026', description: 'Senha de acesso' })
  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve conter pelo menos 6 caracteres' })
  ownerPassword: string;

  @ApiProperty({ example: 'BASIC', required: false, description: 'Plano escolhido: BASIC, PROFESSIONAL ou PREMIUM' })
  @IsOptional()
  @IsString()
  plan?: string;
}


