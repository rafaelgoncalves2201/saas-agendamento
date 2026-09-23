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
const client_1 = require("@prisma/client");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProducts(companyId, filters) {
        const isArchived = filters?.isArchived === true;
        return this.prisma.product.findMany({
            where: {
                companyId,
                isArchived,
                ...(filters?.type && filters.type !== 'ALL' && { type: filters.type }),
                ...(filters?.search && {
                    OR: [
                        { name: { contains: filters.search, mode: 'insensitive' } },
                        { sku: { contains: filters.search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        });
    }
    async getStats(companyId) {
        const [totalActive, allActiveProducts, totalArchived] = await Promise.all([
            this.prisma.product.count({
                where: { companyId, isArchived: false, isActive: true },
            }),
            this.prisma.product.findMany({
                where: { companyId, isArchived: false, isActive: true },
                select: { stock: true, minStock: true },
            }),
            this.prisma.product.count({
                where: { companyId, isArchived: true },
            }),
        ]);
        const lowStock = allActiveProducts.filter((p) => p.stock <= p.minStock).length;
        return {
            totalActive,
            lowStock,
            totalArchived,
        };
    }
    async getProduct(companyId, id) {
        const product = await this.prisma.product.findFirst({
            where: { id, companyId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Item de estoque não encontrado');
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
        if (!features.products && !features.inventoryControl) {
            throw new common_1.ForbiddenException('O recurso de Controle de Estoque não está habilitado no seu plano atual. Faça upgrade para o plano Professional ou Business.');
        }
        const initialStock = dto.stock !== undefined ? Number(dto.stock) : 0;
        const minStock = dto.minStock !== undefined ? Number(dto.minStock) : 0;
        const cost = dto.cost !== undefined ? Number(dto.cost) : 0;
        const price = dto.price !== undefined ? Number(dto.price) : cost;
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    companyId,
                    name: dto.name.trim(),
                    type: dto.type?.trim() || 'Insumo atendimento',
                    unit: dto.unit?.trim() || 'un',
                    sku: dto.sku?.trim() || null,
                    stock: initialStock,
                    minStock,
                    cost: new client_1.Prisma.Decimal(cost),
                    price: new client_1.Prisma.Decimal(price),
                    promotionalPrice: dto.promotionalPrice
                        ? new client_1.Prisma.Decimal(dto.promotionalPrice)
                        : null,
                    category: dto.category || null,
                    description: dto.description || null,
                    notes: dto.notes || null,
                    imageUrl: dto.imageUrl || null,
                    sortOrder: dto.sortOrder || 0,
                },
            });
            if (initialStock > 0) {
                await tx.stockMovement.create({
                    data: {
                        companyId,
                        productId: product.id,
                        type: client_1.StockMovementType.ENTRY,
                        quantity: initialStock,
                        previousStock: 0,
                        newStock: initialStock,
                        reason: 'Saldo inicial de cadastro',
                        cost: new client_1.Prisma.Decimal(cost),
                    },
                });
            }
            return product;
        });
    }
    async updateProduct(companyId, id, dto) {
        await this.getProduct(companyId, id);
        return this.prisma.product.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name.trim() }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.unit !== undefined && { unit: dto.unit }),
                ...(dto.sku !== undefined && { sku: dto.sku }),
                ...(dto.stock !== undefined && { stock: Number(dto.stock) }),
                ...(dto.minStock !== undefined && { minStock: Number(dto.minStock) }),
                ...(dto.cost !== undefined && { cost: new client_1.Prisma.Decimal(dto.cost) }),
                ...(dto.price !== undefined && { price: new client_1.Prisma.Decimal(dto.price) }),
                ...(dto.promotionalPrice !== undefined && {
                    promotionalPrice: dto.promotionalPrice ? new client_1.Prisma.Decimal(dto.promotionalPrice) : null,
                }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            },
        });
    }
    async toggleArchive(companyId, id) {
        const product = await this.getProduct(companyId, id);
        return this.prisma.product.update({
            where: { id },
            data: {
                isArchived: !product.isArchived,
            },
        });
    }
    async createMovement(companyId, productId, dto) {
        const product = await this.getProduct(companyId, productId);
        const previousStock = product.stock;
        const qty = Number(dto.quantity);
        if (qty <= 0) {
            throw new common_1.BadRequestException('A quantidade movimentada deve ser maior que zero');
        }
        let newStock = previousStock;
        if (dto.type === client_1.StockMovementType.ENTRY) {
            newStock = previousStock + qty;
        }
        else if (dto.type === client_1.StockMovementType.EXIT) {
            if (previousStock < qty) {
                throw new common_1.BadRequestException(`Saldo insuficiente em estoque. Saldo atual: ${previousStock} ${product.unit}`);
            }
            newStock = previousStock - qty;
        }
        else if (dto.type === client_1.StockMovementType.ADJUSTMENT) {
            newStock = qty;
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: { stock: newStock },
            });
            const movement = await tx.stockMovement.create({
                data: {
                    companyId,
                    productId,
                    type: dto.type,
                    quantity: qty,
                    previousStock,
                    newStock,
                    reason: dto.reason?.trim() || null,
                    cost: dto.cost !== undefined ? new client_1.Prisma.Decimal(dto.cost) : product.cost,
                },
            });
            return {
                product: updatedProduct,
                movement,
            };
        });
    }
    async listMovements(companyId, productId) {
        return this.prisma.stockMovement.findMany({
            where: {
                companyId,
                ...(productId && { productId }),
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        unit: true,
                        type: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
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