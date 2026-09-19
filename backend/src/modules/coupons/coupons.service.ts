import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
import { DiscountType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async listCoupons(companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado');
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

  async createCoupon(companyId: string, dto: CreateCouponDto) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado');
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
      throw new ConflictException(`Já existe um cupom com o código "${cleanCode}" cadastrado.`);
    }

    // Se informou profissional, validar se pertence à empresa
    if (dto.professionalId) {
      const prof = await this.prisma.professional.findFirst({
        where: { id: dto.professionalId, companyId },
      });
      if (!prof) {
        throw new NotFoundException('Profissional informado não encontrado nesta empresa');
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

  async updateCoupon(companyId: string, id: string, dto: UpdateCouponDto) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado');
    }

    const coupon = await this.prisma.coupon.findFirst({
      where: { id, companyId },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    let cleanCode: string | undefined = undefined;
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
        throw new ConflictException(`Já existe um cupom ativo com o código "${cleanCode}".`);
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

  async deleteCoupon(companyId: string, id: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado');
    }

    const coupon = await this.prisma.coupon.findFirst({
      where: { id, companyId },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  async toggleCoupon(companyId: string, id: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado');
    }

    const coupon = await this.prisma.coupon.findFirst({
      where: { id, companyId },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        isActive: !coupon.isActive,
      },
    });
  }

  // Validação pública para checkout do cliente
  async validatePublicCoupon(companySlug: string, dto: ValidateCouponDto) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException('Estabelecimento não encontrado');
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
      throw new NotFoundException('Cupom de desconto inválido ou inexistente.');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Este cupom está temporariamente inativo.');
    }

    // Validar data de expiração
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      throw new BadRequestException('Este cupom de desconto expirou.');
    }

    // Validar limite de usos
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Este cupom atingiu o limite máximo de utilizações.');
    }

    // Validar restrição por profissional
    if (coupon.professionalId && coupon.professionalId !== dto.professionalId) {
      throw new BadRequestException(
        `Este cupom é exclusivo para atendimentos com o profissional ${coupon.professional?.name || ''}.`,
      );
    }

    // Obter serviço e preço
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, companyId: company.id, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const originalPrice = Number(service.price);

    // Validar valor mínimo do pedido
    if (coupon.minOrderValue && originalPrice < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Este cupom é válido apenas para serviços a partir de R$ ${Number(coupon.minOrderValue).toFixed(2)}.`,
      );
    }

    // Calcular desconto
    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (originalPrice * Number(coupon.discountValue)) / 100;
    } else {
      discountAmount = Math.min(originalPrice, Number(coupon.discountValue));
    }

    // Arredondar para 2 casas decimais
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
}

