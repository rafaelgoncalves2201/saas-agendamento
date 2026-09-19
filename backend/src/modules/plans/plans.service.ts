import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async listPublicPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async listAllPlans() {
    return this.prisma.plan.findMany({
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    return plan;
  }

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.plan.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Já existe um plano com este identificador (slug)');
    }

    return this.prisma.plan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
        maxProfessionals: dto.maxProfessionals,
        maxAppointmentsPerMonth: dto.maxAppointmentsPerMonth,
        maxWhatsappMessages: dto.maxWhatsappMessages,
        features: dto.features,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.getPlan(id);

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.priceMonthly !== undefined && { priceMonthly: dto.priceMonthly }),
        ...(dto.priceYearly !== undefined && { priceYearly: dto.priceYearly }),
        ...(dto.maxProfessionals !== undefined && { maxProfessionals: dto.maxProfessionals }),
        ...(dto.maxAppointmentsPerMonth !== undefined && { maxAppointmentsPerMonth: dto.maxAppointmentsPerMonth }),
        ...(dto.maxWhatsappMessages !== undefined && { maxWhatsappMessages: dto.maxWhatsappMessages }),
        ...(dto.features && { features: dto.features }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deletePlan(id: string) {
    const plan = await this.getPlan(id);

    const activeSubscriptions = await this.prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });

    if (activeSubscriptions > 0) {
      // Se houver assinaturas ativas, desativa em vez de deletar para manter integridade
      return this.prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.plan.delete({
      where: { id },
    });
  }
}

