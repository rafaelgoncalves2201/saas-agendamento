import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto, SubmitAppointmentReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // Enviar avaliação diretamente pelo código de gestão do agendamento (AppointmentTrackingPage)
  async submitAppointmentReview(managementCode: string, dto: SubmitAppointmentReviewDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { clientManagementCode: managementCode },
      include: { client: true, company: true, review: true },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.review) {
      throw new BadRequestException('Este atendimento já foi avaliado anteriormente.');
    }

    return this.prisma.review.create({
      data: {
        companyId: appointment.companyId,
        appointmentId: appointment.id,
        serviceId: appointment.serviceId,
        professionalId: appointment.professionalId,
        clientName: appointment.client?.name || 'Cliente',
        clientPhone: appointment.client?.phone || null,
        rating: Number(dto.rating),
        comment: dto.comment?.trim() || null,
        isApproved: true,
      },
    });
  }

  // Enviar avaliação geral pela página pública
  async createPublicReview(companySlug: string, dto: CreateReviewDto) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return this.prisma.review.create({
      data: {
        companyId: company.id,
        clientName: dto.clientName.trim(),
        clientPhone: dto.clientPhone?.replace(/\D/g, '') || null,
        rating: Number(dto.rating),
        comment: dto.comment?.trim() || null,
        serviceId: dto.serviceId || null,
        professionalId: dto.professionalId || null,
        isApproved: true,
      },
    });
  }

  // Obter resumo e depoimentos para a página pública
  async getPublicReviews(companySlug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
    });

    if (!company) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    const reviews = await this.prisma.review.findMany({
      where: { companyId: company.id, isApproved: true },
      include: {
        service: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount) * 10) / 10
        : 5.0;

    return {
      averageRating,
      totalCount,
      reviews,
    };
  }

  // Painel: listar todas as avaliações com métricas gerais
  async listReviews(companyId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { companyId },
      include: {
        service: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        appointment: { select: { startDateTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount) * 10) / 10
        : 5.0;

    const fiveStars = reviews.filter((r) => r.rating === 5).length;
    const fourStars = reviews.filter((r) => r.rating === 4).length;

    return {
      averageRating,
      totalCount,
      fiveStars,
      fourStars,
      reviews,
    };
  }

  // Painel: aprovar / ocultar avaliação
  async toggleApproval(companyId: string, id: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, companyId },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    return this.prisma.review.update({
      where: { id },
      data: { isApproved: !review.isApproved },
    });
  }

  // Painel: excluir avaliação
  async deleteReview(companyId: string, id: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, companyId },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    return this.prisma.review.delete({
      where: { id },
    });
  }
}

