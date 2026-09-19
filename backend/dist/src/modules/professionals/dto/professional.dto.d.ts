export declare class CreateProfessionalDto {
    name: string;
    slug: string;
    email?: string;
    phone: string;
    bio?: string;
    avatarUrl?: string;
    serviceIds?: string[];
}
export declare class UpdateProfessionalDto {
    name?: string;
    slug?: string;
    email?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    serviceIds?: string[];
    isActive?: boolean;
}
