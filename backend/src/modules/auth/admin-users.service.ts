import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  // Listar todos os usuários do SaaS com dados de empresa vinculada
  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            role: true,
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Criar novo usuário
  async createUser(dto: CreateAdminUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim() || null,
        role: dto.role,
        passwordHash,
        isActive: true,
      },
    });

    // Se informou empresa, vincular como membro
    if (dto.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });
      if (company) {
        await this.prisma.companyMember.create({
          data: {
            companyId: company.id,
            userId: user.id,
            role: dto.role === Role.SUPER_ADMIN ? Role.COMPANY_ADMIN : dto.role,
          },
        });
      }
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        memberships: {
          include: { company: true },
        },
      },
    });
  }

  // Atualizar usuário existente
  async updateUser(id: string, dto: UpdateAdminUserDto, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { memberships: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se estiver alterando o próprio usuário, não permitir desativar ou rebaixar role de SUPER_ADMIN
    if (user.id === currentUserId) {
      if (dto.isActive === false) {
        throw new BadRequestException('Você não pode desativar a sua própria conta Super Admin');
      }
      if (dto.role && dto.role !== Role.SUPER_ADMIN) {
        throw new BadRequestException('Você não pode remover o cargo de Super Admin da sua própria conta');
      }
    }

    // Se alterando e-mail, verificar duplicidade
    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const collision = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (collision) {
        throw new ConflictException('Já existe outro usuário com este e-mail');
      }
    }

    const dataToUpdate: any = {};
    if (dto.name) dataToUpdate.name = dto.name.trim();
    if (dto.email) dataToUpdate.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) dataToUpdate.phone = dto.phone ? dto.phone.trim() : null;
    if (dto.role) dataToUpdate.role = dto.role;
    if (dto.isActive !== undefined) dataToUpdate.isActive = dto.isActive;
    if (dto.password && dto.password.trim().length >= 6) {
      dataToUpdate.passwordHash = await argon2.hash(dto.password.trim());
    }

    await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    // Se informou empresa para vincular ou transferir
    if (dto.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });
      if (company) {
        // Remover membros antigos e criar novo vínculo
        await this.prisma.companyMember.deleteMany({
          where: { userId: user.id },
        });
        await this.prisma.companyMember.create({
          data: {
            companyId: company.id,
            userId: user.id,
            role: dto.role === Role.SUPER_ADMIN ? Role.COMPANY_ADMIN : (dto.role || user.role),
          },
        });
      }
    }

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: { company: true },
        },
      },
    });
  }

  // Excluir usuário
  async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Você não pode excluir o seu próprio usuário Super Admin');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Excluir registros dependentes e o usuário
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
      this.prisma.companyMember.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);

    return { success: true, message: `Usuário ${user.name} excluído com sucesso.` };
  }
}

