import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async listProducts(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getProduct(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async createProduct(companyId: string, dto: CreateProductDto) {
    // Validar se o plano da empresa autoriza catálogo de produtos
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    const features = (company?.subscription?.plan?.features as Record<string, any>) || {};
    if (!features.products) {
      throw new ForbiddenException(
        'O recurso de catálogo de produtos não está habilitado no seu plano. Faça upgrade para o plano Professional ou Business.',
      );
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

  async updateProduct(companyId: string, id: string, dto: UpdateProductDto) {
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

  async deleteProduct(companyId: string, id: string) {
    await this.getProduct(companyId, id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}

