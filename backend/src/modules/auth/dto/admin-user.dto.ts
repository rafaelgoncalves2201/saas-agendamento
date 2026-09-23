import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateAdminUserDto {
  @ApiProperty({ description: 'Nome completo do usuário', example: 'Maria Gerente' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ description: 'E-mail para login', example: 'maria@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ description: 'Senha de acesso (mínimo 6 caracteres)', example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({ description: 'WhatsApp ou telefone com DDD', example: '11999998888' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Nível de permissão (cargo)', enum: Role, default: Role.COMPANY_ADMIN })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ description: 'ID da empresa para vincular este usuário' })
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: 'Nome completo do usuário' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'E-mail para login' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Nova senha (deixe vazio se não quiser alterar)' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({ description: 'WhatsApp ou telefone com DDD' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Nível de permissão (cargo)', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Status da conta (ativo ou bloqueado)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID da empresa vinculada' })
  @IsOptional()
  @IsString()
  companyId?: string;
}

