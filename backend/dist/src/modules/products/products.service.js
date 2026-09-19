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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProducts(companyId) {
        return this.prisma.product.findMany({
            where: { companyId },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getProduct(companyId, id) {
        const product = await this.prisma.product.findFirst({
            where: { id, companyId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        return product;
    }
    async createProduct(companyId, dto) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });
        const features = company?.subscription?.plan?.features || {};
        if (!features.products) {
            throw new common_1.ForbiddenException('O recurso de catálogo de produtos não está habilitado no seu plano. Faça upgrade para o plano Professional ou Business.');
        }
        return this.prisma.product.create({
            data: {
                companyId,
                name: dto.name,
                description: dto.description || null,
                price: dto.price,
                promotionalPrice: dto.promotionalPrice || null,
                category: dto.category || null,
                stock: dto.stock !== undefined ? dto.stock : null,
                sku: dto.sku || null,
                imageUrl: dto.imageUrl || null,
                sortOrder: dto.sortOrder || 0,
            },
        });
    }
    async updateProduct(companyId, id, dto) {
        await this.getProduct(companyId, id);
        return this.prisma.product.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.price !== undefined && { price: dto.price }),
                ...(dto.promotionalPrice !== undefined && { promotionalPrice: dto.promotionalPrice }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.stock !== undefined && { stock: dto.stock }),
                ...(dto.sku !== undefined && { sku: dto.sku }),
                ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            },
        });
    }
    async deleteProduct(companyId, id) {
        await this.getProduct(companyId, id);
        return this.prisma.product.delete({
            where: { id },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map