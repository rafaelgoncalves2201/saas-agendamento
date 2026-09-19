"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let CouponsService = class CouponsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCoupons(companyId) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado');
        }
        return this.prisma.coupon.findMany({
            where: { companyId },
            include: {
                professional: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createCoupon(companyId, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado');
        }
        const cleanCode = dto.code.trim().toUpperCase().replace(/\s+/g, '');
        const existing = await this.prisma.coupon.findUnique({
            where: {
                companyId_code: {
                    companyId,
                    code: cleanCode,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Já existe um cupom com o código "${cleanCode}" cadastrado.`);
        }
        if (dto.professionalId) {
            const prof = await this.prisma.professional.findFirst({
                where: { id: dto.professionalId, companyId },
            });
            if (!prof) {
                throw new common_1.NotFoundException('Profissional informado não encontrado nesta empresa');
            }
        }
        return this.prisma.coupon.create({
            data: {
                companyId,
                code: cleanCode,
                description: dto.description || null,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                minOrderValue: dto.minOrderValue || null,
                maxUses: dto.maxUses || null,
                professionalId: dto.professionalId || null,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
            include: {
                professional: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async updateCoupon(companyId, id, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado');
        }
        const coupon = await this.prisma.coupon.findFirst({
            where: { id, companyId },
        });
        if (!coupon) {
            throw new common_1.NotFoundException('Cupom não encontrado');
        }
        let cleanCode = undefined;
        if (dto.code) {
            cleanCode = dto.code.trim().toUpperCase().replace(/\s+/g, '');
            const existing = await this.prisma.coupon.findUnique({
                where: {
                    companyId_code: {
                        companyId,
                        code: cleanCode,
                    },
                },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Já existe um cupom ativo com o código "${cleanCode}".`);
            }
        }
        return this.prisma.coupon.update({
            where: { id },
            data: {
                ...(cleanCode ? { code: cleanCode } : {}),
                ...(dto.description !== undefined && { description: dto.description || null }),
                ...(dto.discountType && { discountType: dto.discountType }),
                ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
                ...(dto.minOrderValue !== undefined && { minOrderValue: dto.minOrderValue || null }),
                ...(dto.maxUses !== undefined && { maxUses: dto.maxUses || null }),
                ...(dto.professionalId !== undefined && { professionalId: dto.professionalId || null }),
                ...(dto.validUntil !== undefined && { validUntil: dto.validUntil ? new Date(dto.validUntil) : null }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
            include: {
                professional: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async deleteCoupon(companyId, id) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado');
        }
        const coupon = await this.prisma.coupon.findFirst({
            where: { id, companyId },
        });
        if (!coupon) {
            throw new common_1.NotFoundException('Cupom não encontrado');
        }
        return this.prisma.coupon.delete({
            where: { id },
        });
    }
    async toggleCoupon(companyId, id) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado');
        }
        const coupon = await this.prisma.coupon.findFirst({
            where: { id, companyId },
        });
        if (!coupon) {
            throw new common_1.NotFoundException('Cupom não encontrado');
        }
        return this.prisma.coupon.update({
            where: { id },
            data: {
                isActive: !coupon.isActive,
            },
        });
    }
    async validatePublicCoupon(companySlug, dto) {
        const company = await this.prisma.company.findUnique({
            where: { slug: companySlug },
        });
        if (!company || !company.isActive) {
            throw new common_1.NotFoundException('Estabelecimento não encontrado');
        }
        const cleanCode = dto.code.trim().toUpperCase().replace(/\s+/g, '');
        const coupon = await this.prisma.coupon.findUnique({
            where: {
                companyId_code: {
                    companyId: company.id,
                    code: cleanCode,
                },
            },
            include: {
                professional: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!coupon) {
            throw new common_1.NotFoundException('Cupom de desconto inválido ou inexistente.');
        }
        if (!coupon.isActive) {
            throw new common_1.BadRequestException('Este cupom está temporariamente inativo.');
        }
        if (coupon.validUntil && new Date() > coupon.validUntil) {
            throw new common_1.BadRequestException('Este cupom de desconto expirou.');
        }
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            throw new common_1.BadRequestException('Este cupom atingiu o limite máximo de utilizações.');
        }
        if (coupon.professionalId && coupon.professionalId !== dto.professionalId) {
            throw new common_1.BadRequestException(`Este cupom é exclusivo para atendimentos com o profissional ${coupon.professional?.name || ''}.`);
        }
        const service = await this.prisma.service.findFirst({
            where: { id: dto.serviceId, companyId: company.id, isActive: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('Serviço não encontrado');
        }
        const originalPrice = Number(service.price);
        if (coupon.minOrderValue && originalPrice < Number(coupon.minOrderValue)) {
            throw new common_1.BadRequestException(`Este cupom é válido apenas para serviços a partir de R$ ${Number(coupon.minOrderValue).toFixed(2)}.`);
        }
        let discountAmount = 0;
        if (coupon.discountType === client_1.DiscountType.PERCENTAGE) {
            discountAmount = (originalPrice * Number(coupon.discountValue)) / 100;
        }
        else {
            discountAmount = Math.min(originalPrice, Number(coupon.discountValue));
        }
        discountAmount = Math.round(discountAmount * 100) / 100;
        const finalPrice = Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100);
        return {
            valid: true,
            message: 'Cupom aplicado com sucesso!',
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: Number(coupon.discountValue),
            },
            originalPrice,
            discountAmount,
            finalPrice,
        };
    }
};
exports.CouponsService = CouponsService;
exports.CouponsService = CouponsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CouponsService);
//# sourceMappingURL=coupons.service.js.map