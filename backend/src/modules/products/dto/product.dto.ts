import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Cola de Cílios Premium' })
  @IsString()
  @IsNotEmpty({ message: 'O nome do insumo/produto é obrigatório' })
  name: string;

  @ApiProperty({ example: 'Insumo atendimento', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 'un', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 'COL-PREM-01', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 10, required: false, description: 'Saldo inicial' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 2, required: false, description: 'Estoque mínimo para alerta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiProperty({ example: 45.0, required: false, description: 'Custo de compra' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({ example: 0, required: false, description: 'Preço de venda (opcional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  promotionalPrice?: number;

  @ApiProperty({ example: 'Insumos', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Fornecedor XYZ, referência ou observação interna', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Uso em atendimentos de extensão de cílios', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-item.png', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  promotionalPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateStockMovementDto {
  @ApiProperty({ enum: StockMovementType, example: StockMovementType.ENTRY })
  @IsEnum(StockMovementType, { message: 'Tipo deve ser ENTRY, EXIT ou ADJUSTMENT' })
  type: StockMovementType;

  @ApiProperty({ example: 5, description: 'Quantidade movimentada' })
  @IsNumber()
  @Min(1, { message: 'A quantidade deve ser de no mínimo 1' })
  quantity: number;

  @ApiProperty({ example: 'Compra de reposição', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 45.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}
