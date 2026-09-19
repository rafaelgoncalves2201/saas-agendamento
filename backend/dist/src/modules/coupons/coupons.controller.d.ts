import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
export declare class CouponsController {
    private readonly couponsService;
    constructor(couponsService: CouponsService);
    listCoupons(req: any): Promise<({
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
    createCoupon(req: any, dto: CreateCouponDto): Promise<{
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
    updateCoupon(req: any, id: string, dto: UpdateCouponDto): Promise<{
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
    deleteCoupon(req: any, id: string): Promise<{
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
    toggleCoupon(req: any, id: string): Promise<{
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
    validatePublicCoupon(slug: string, dto: ValidateCouponDto): Promise<{
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
