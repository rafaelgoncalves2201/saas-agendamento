import { StockMovementType } from '@prisma/client';
export declare class CreateProductDto {
    name: string;
    type?: string;
    unit?: string;
    sku?: string;
    stock?: number;
    minStock?: number;
    cost?: number;
    price?: number;
    promotionalPrice?: number;
    category?: string;
    notes?: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
}
export declare class UpdateProductDto {
    name?: string;
    type?: string;
    unit?: string;
    sku?: string;
    stock?: number;
    minStock?: number;
    cost?: number;
    price?: number;
    promotionalPrice?: number;
    category?: string;
    notes?: string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
    isArchived?: boolean;
    sortOrder?: number;
}
export declare class CreateStockMovementDto {
    type: StockMovementType;
    quantity: number;
    reason?: string;
    cost?: number;
}
