export declare class CreateServiceDto {
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    category?: string;
    imageUrl?: string;
    professionalIds?: string[];
    sortOrder?: number;
}
export declare class UpdateServiceDto {
    name?: string;
    description?: string;
    durationMinutes?: number;
    price?: number;
    category?: string;
    imageUrl?: string;
    professionalIds?: string[];
    isActive?: boolean;
    sortOrder?: number;
}
