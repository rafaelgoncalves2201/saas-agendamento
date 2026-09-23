import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWaitlistEntryDto, UpdateWaitlistStatusDto } from './dto/waitlist.dto';
import { WaitlistStatus } from '@prisma/client';

@Injectable()
export class WaitlistService {
  constructor(private prisma: PrismaService) {}

  // Cliente entra na lista de espera através da página pública
  async createPublicEntry(companySlug: string, dto: CreateWaitlistEntryDto) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    const cleanPhone = dto.clientPhone.replace(/\D/g, '');

    return this.prisma.waitlistEntry.create({
      data: {
        companyId: company.id,
        clientName: dto.clientName.trim(),
        clientPhone: cleanPhone,
        clientEmail: dto.clientEmail?.trim() || null,
        serviceId: dto.serviceId || null,
        professionalId: dto.professionalId || null,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        preferredPeriod: dto.preferredPeriod || 'QUALQUER',
        notes: dto.notes?.trim() || null,
        status: WaitlistStatus.PENDING,
      },
      include: {
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        professional: { select: { id: true, name: true } },
      },
    });
  }

  // Painel: listar todas as entradas da lista de espera
  async listEntries(companyId: string, status?: WaitlistStatus) {
    return this.prisma.waitlistEntry.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
      },
      include: {
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        professional: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Painel: atualizar status (ex: NOTIFIED, BOOKED, CANCELLED)
  async updateStatus(companyId: string, id: string, dto: UpdateWaitlistStatusDto) {
    const entry = await this.prisma.waitlistEntry.findFirst({
      where: { id, companyId },
    });

    if (!entry) {
      throw new NotFoundException('Entrada da lista de espera não encontrada');
    }

    return this.prisma.waitlistEntry.update({
      where: { id },
      data: { status: dto.status },
      include: {
        service: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
    });
  }

  // Painel: remover da lista de espera
  async deleteEntry(companyId: string, id: string) {
    const entry = await this.prisma.waitlistEntry.findFirst({
      where: { id, companyId },
    });

    if (!entry) {
      throw new NotFoundException('Entrada da lista de espera não encontrada');
    }

    return this.prisma.waitlistEntry.delete({
      where: { id },
    });
  }
}

