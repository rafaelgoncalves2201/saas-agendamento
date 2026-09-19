import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async listProfessionals(companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    return this.prisma.professional.findMany({
      where: { companyId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        availabilities: true,
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getProfessional(companyId: string, id: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    const professional = await this.prisma.professional.findFirst({
      where: { id, companyId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        availabilities: true,
        blockedTimes: true,
      },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    return professional;
  }

  async createProfessional(companyId: string, dto: CreateProfessionalDto) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    // 1. Validar Limite do Plano da Empresa
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const maxAllowed = company.subscription?.plan?.maxProfessionals || 1;
    const currentCount = await this.prisma.professional.count({
      where: { companyId, isActive: true },
    });

    if (currentCount >= maxAllowed) {
      throw new ForbiddenException(
        `Limite de profissionais atingido para o plano ${company.subscription?.plan?.name || 'atual'} (máximo ${maxAllowed}). Faça upgrade para adicionar mais profissionais.`,
      );
    }

    // 2. Validar unicidade do slug na empresa
    const cleanSlug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existingSlug = await this.prisma.professional.findUnique({
      where: {
        companyId_slug: {
          companyId,
          slug: cleanSlug,
        },
      },
    });

    if (existingSlug) {
      throw new ConflictException('Já existe um profissional com este identificador (slug) nesta empresa');
    }

    return this.prisma.$transaction(async (tx) => {
      const professional = await tx.professional.create({
        data: {
          companyId,
          name: dto.name,
          slug: cleanSlug,
          phone: dto.phone,
          email: dto.email || null,
          bio: dto.bio || null,
          avatarUrl: dto.avatarUrl || null,
        },
      });

      // Vincular serviços se fornecidos
      if (dto.serviceIds && dto.serviceIds.length > 0) {
        await tx.professionalService.createMany({
          data: dto.serviceIds.map((srvId) => ({
            professionalId: professional.id,
            serviceId: srvId,
          })),
        });
      }

      // Copiar horários de funcionamento padrão da empresa para o profissional
      const companyAvailabilities = await tx.availability.findMany({
        where: { companyId, professionalId: null, isActive: true },
      });

      for (const avail of companyAvailabilities) {
        await tx.availability.create({
          data: {
            companyId,
            professionalId: professional.id,
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            breakStart: avail.breakStart,
            breakEnd: avail.breakEnd,
            isActive: true,
          },
        });
      }

      return professional;
    });
  }

  async updateProfessional(companyId: string, id: string, dto: UpdateProfessionalDto) {
    await this.getProfessional(companyId, id);

    let cleanSlug: string | undefined = undefined;
    if (dto.slug) {
      cleanSlug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      const existing = await this.prisma.professional.findFirst({
        where: {
          companyId,
          slug: cleanSlug,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Este slug já está em uso por outro profissional');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.professional.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(cleanSlug && { slug: cleanSlug }),
          ...(dto.phone && { phone: dto.phone }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      if (dto.serviceIds) {
        await tx.professionalService.deleteMany({
          where: { professionalId: id },
        });

        if (dto.serviceIds.length > 0) {
          await tx.professionalService.createMany({
            data: dto.serviceIds.map((srvId) => ({
              professionalId: id,
              serviceId: srvId,
            })),
          });
        }
      }

      return updated;
    });
  }

  async deleteProfessional(companyId: string, id: string) {
    await this.getProfessional(companyId, id);

    const appointments = await this.prisma.appointment.count({
      where: { professionalId: id },
    });

    if (appointments > 0) {
      return this.prisma.professional.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.professional.delete({
      where: { id },
    });
  }

  // Página pública individual do profissional
  async getPublicProfessional(companySlug: string, professionalSlug: string) {
    const professional = await this.prisma.professional.findFirst({
      where: {
        slug: professionalSlug,
        company: { slug: companySlug, isActive: true },
        isActive: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            coverUrl: true,
            settings: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                durationMinutes: true,
                price: true,
                imageUrl: true,
                category: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado ou inativo');
    }

    return professional;
  }
}

