import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
export declare class CouponsService {
    private prisma;
    constructor(prisma: PrismaService);
    listCoupons(companyId: string): Promise<({
        professional: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        companyId: string;
        professionalId: string | null;
        code: string;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        minOrderValue: import("@prisma/client/runtime/library").Decimal | null;
        maxUses: number | null;
        usedCount: number;
        validUntil: Date | null;
    })[]>;
    createCoupon(companyId: string, dto: CreateCouponDto): Promise<{
        professional: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        companyId: string;
        professionalId: string | null;
        code: string;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        minOrderValue: import("@prisma/client/runtime/library").Decimal | null;
        maxUses: number | null;
        usedCount: number;
        validUntil: Date | null;
    }>;
    updateCoupon(companyId: string, id: string, dto: UpdateCouponDto): Promise<{
        professional: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        companyId: string;
        professionalId: string | null;
        code: string;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        minOrderValue: import("@prisma/client/runtime/library").Decimal | null;
        maxUses: number | null;
        usedCount: number;
        validUntil: Date | null;
    }>;
    deleteCoupon(companyId: string, id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        companyId: string;
        professionalId: string | null;
        code: string;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        minOrderValue: import("@prisma/client/runtime/library").Decimal | null;
        maxUses: number | null;
        usedCount: number;
        validUntil: Date | null;
    }>;
    toggleCoupon(companyId: string, id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        companyId: string;
        professionalId: string | null;
        code: string;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        minOrderValue: import("@prisma/client/runtime/library").Decimal | null;
        maxUses: number | null;
        usedCount: number;
        validUntil: Date | null;
    }>;
    validatePublicCoupon(companySlug: string, dto: ValidateCouponDto): Promise<{
        valid: boolean;
        message: string;
        coupon: {
            id: string;
            code: string;
            discountType: import(".prisma/client").$Enums.DiscountType;
            discountValue: number;
        };
        originalPrice: number;
        discountAmount: number;
        finalPrice: number;
    }>;
}
