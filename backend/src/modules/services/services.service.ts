import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async listServices(companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    return this.prisma.service.findMany({
      where: { companyId },
      include: {
        professionals: {
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                slug: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getService(companyId: string, id: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    const service = await this.prisma.service.findFirst({
      where: { id, companyId },
      include: {
        professionals: {
          include: {
            professional: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    return service;
  }

  async createService(companyId: string, dto: CreateServiceDto) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          companyId,
          name: dto.name,
          description: dto.description || null,
          durationMinutes: dto.durationMinutes,
          price: dto.price,
          category: dto.category || null,
          imageUrl: dto.imageUrl || null,
          sortOrder: dto.sortOrder || 0,
        },
      });

      if (dto.professionalIds && dto.professionalIds.length > 0) {
        await tx.professionalService.createMany({
          data: dto.professionalIds.map((profId) => ({
            professionalId: profId,
            serviceId: service.id,
          })),
        });
      }

      return service;
    });
  }

  async updateService(companyId: string, id: string, dto: UpdateServiceDto) {
    await this.getService(companyId, id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        },
      });

      if (dto.professionalIds) {
        // Atualizar associações
        await tx.professionalService.deleteMany({
          where: { serviceId: id },
        });

        if (dto.professionalIds.length > 0) {
          await tx.professionalService.createMany({
            data: dto.professionalIds.map((profId) => ({
              professionalId: profId,
              serviceId: id,
            })),
          });
        }
      }

      return updated;
    });
  }

  async deleteService(companyId: string, id: string) {
    await this.getService(companyId, id);

    const appointmentsCount = await this.prisma.appointment.count({
      where: { serviceId: id },
    });

    if (appointmentsCount > 0) {
      // Soft-delete para não quebrar o histórico de agendamentos
      return this.prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }
}

