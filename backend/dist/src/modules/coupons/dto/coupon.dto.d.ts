import { DiscountType } from '@prisma/client';
export declare class CreateCouponDto {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderValue?: number;
    maxUses?: number;
    professionalId?: string;
    validUntil?: string;
    isActive?: boolean;
}
export declare class UpdateCouponDto {
    code?: string;
    description?: string;
    discountType?: DiscountType;
    discountValue?: number;
    minOrderValue?: number;
    maxUses?: number;
    professionalId?: string;
    validUntil?: string;
    isActive?: boolean;
}
export declare class ValidateCouponDto {
    code: string;
    serviceId: string;
    professionalId: string;
}
