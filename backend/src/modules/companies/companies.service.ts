import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getCompany(companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    const existing = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existing) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Mesclar configurações se fornecidas
    let settings = existing.settings as Record<string, any>;
    if (dto.settings) {
      settings = {
        ...settings,
        ...dto.settings,
      };
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.email && { email: dto.email }),
        ...(dto.document !== undefined && { document: dto.document }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl }),
        settings,
      },
    });
  }

  async getMembers(companyId: string) {
    return this.prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCompanyPublic(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        logoUrl: true,
        coverUrl: true,
        settings: true,
        isActive: true,
        professionals: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            bio: true,
            avatarUrl: true,
            phone: true,
          },
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            price: true,
            category: true,
            imageUrl: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException('Empresa não encontrada ou inativa');
    }

    return company;
  }

  // Métodos do Super Admin
  async listAllCompanies() {
    return this.prisma.company.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            professionals: true,
            clients: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleCompanyStatus(companyId: string, isActive: boolean) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: { isActive },
    });
  }
}

