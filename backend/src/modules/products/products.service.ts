import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProductDto,
  CreateStockMovementDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Prisma, StockMovementType } from '@prisma/client';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {}

  // Listar itens de estoque com filtros (busca, tipo, arquivados)
  async listProducts(
    companyId: string,
    filters?: {
      search?: string;
      type?: string;
      isArchived?: boolean;
    },
  ) {
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

  // Estatísticas do estoque para os KPIs da tela
  async getStats(companyId: string) {
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

  // Obter item específico
  async getProduct(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Item de estoque não encontrado');
    }

    return product;
  }

  // Criar novo item de estoque / insumo
  async createProduct(companyId: string, dto: CreateProductDto) {
    // Validar se o plano da empresa autoriza controle de estoque ou produtos
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    const features = (company?.subscription?.plan?.features as Record<string, any>) || {};
    if (!features.products && !features.inventoryControl) {
      throw new ForbiddenException(
        'O recurso de Controle de Estoque não está habilitado no seu plano atual. Faça upgrade para o plano Professional ou Business.',
      );
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
          cost: new Prisma.Decimal(cost),
          price: new Prisma.Decimal(price),
          promotionalPrice: dto.promotionalPrice
            ? new Prisma.Decimal(dto.promotionalPrice)
            : null,
          category: dto.category || null,
          description: dto.description || null,
          notes: dto.notes || null,
          imageUrl: dto.imageUrl || null,
          sortOrder: dto.sortOrder || 0,
        },
      });

      // Se houver saldo inicial, registrar a movimentação inicial de entrada
      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            companyId,
            productId: product.id,
            type: StockMovementType.ENTRY,
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            reason: 'Saldo inicial de cadastro',
            cost: new Prisma.Decimal(cost),
          },
        });
      }

      return product;
    });
  }

  // Atualizar dados cadastrais do item
  async updateProduct(companyId: string, id: string, dto: UpdateProductDto) {
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
        ...(dto.cost !== undefined && { cost: new Prisma.Decimal(dto.cost) }),
        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
        ...(dto.promotionalPrice !== undefined && {
          promotionalPrice: dto.promotionalPrice ? new Prisma.Decimal(dto.promotionalPrice) : null,
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

  // Alternar arquivamento
  async toggleArchive(companyId: string, id: string) {
    const product = await this.getProduct(companyId, id);

    return this.prisma.product.update({
      where: { id },
      data: {
        isArchived: !product.isArchived,
      },
    });
  }

  // Registrar movimentação de estoque (Entrada, Saída ou Ajuste)
  async createMovement(companyId: string, productId: string, dto: CreateStockMovementDto) {
    const product = await this.getProduct(companyId, productId);
    const previousStock = product.stock;
    const qty = Number(dto.quantity);

    if (qty <= 0) {
      throw new BadRequestException('A quantidade movimentada deve ser maior que zero');
    }

    let newStock = previousStock;

    if (dto.type === StockMovementType.ENTRY) {
      newStock = previousStock + qty;
    } else if (dto.type === StockMovementType.EXIT) {
      if (previousStock < qty) {
        throw new BadRequestException(
          `Saldo insuficiente em estoque. Saldo atual: ${previousStock} ${product.unit}`,
        );
      }
      newStock = previousStock - qty;
    } else if (dto.type === StockMovementType.ADJUSTMENT) {
      newStock = qty;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Atualizar saldo no produto
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      // 2. Registrar histórico
      const movement = await tx.stockMovement.create({
        data: {
          companyId,
          productId,
          type: dto.type,
          quantity: qty,
          previousStock,
          newStock,
          reason: dto.reason?.trim() || null,
          cost: dto.cost !== undefined ? new Prisma.Decimal(dto.cost) : product.cost,
        },
      });

      return {
        product: updatedProduct,
        movement,
      };
    });

    // 3. Notificar profissionais via WhatsApp caso atinja nível crítico de estoque
    const reachedMinStock = product.minStock > 0 && newStock <= product.minStock;
    const reachedZero = previousStock > 0 && newStock === 0;

    if (dto.type !== StockMovementType.ENTRY && (reachedMinStock || reachedZero)) {
      this.whatsAppService
        .sendLowStockAlert(companyId, productId, newStock, product.minStock, product.unit)
        .catch((err) => {
          console.error('[ProductsService] Erro ao disparar alerta de estoque baixo via WhatsApp:', err?.message || err);
        });
    }

    return result;
  }

  // Listar histórico de movimentações da empresa
  async listMovements(companyId: string, productId?: string) {
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

  // Excluir item
  async deleteProduct(companyId: string, id: string) {
    await this.getProduct(companyId, id);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // Enviar alerta avulso de reposição via WhatsApp para um produto específico
  async sendRestockAlert(companyId: string, productId: string) {
    const product = await this.getProduct(companyId, productId);
    return this.whatsAppService.sendLowStockAlert(
      companyId,
      productId,
      product.stock,
      product.minStock,
      product.unit,
    );
  }

  // Enviar alerta consolidado de reposição via WhatsApp para todos os produtos com estoque baixo
  async sendBulkRestockAlert(companyId: string) {
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        companyId,
        isArchived: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        unit: true,
        sku: true,
      },
    });

    const criticalItems = lowStockProducts.filter((p) => p.stock <= p.minStock);
    if (criticalItems.length === 0) {
      return { success: true, sentCount: 0, message: 'Nenhum item com estoque baixo no momento.' };
    }

    return this.whatsAppService.sendBulkLowStockAlert(companyId, criticalItems);
  }
}
