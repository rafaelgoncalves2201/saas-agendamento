export declare class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    promotionalPrice?: number;
    category?: string;
    stock?: number;
    sku?: string;
    imageUrl?: string;
    sortOrder?: number;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    promotionalPrice?: number;
    category?: string;
    stock?: number;
    sku?: string;
    imageUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
}
