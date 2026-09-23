import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, SubmitAppointmentReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Avaliações & Depoimentos')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // =========================================================================
  // ENDPOINTS PÚBLICOS (CLIENTE AVALIA OU CONSULTA NOTAS)
  // =========================================================================
  @Public()
  @Post('public/appointments/:code/review')
  @ApiOperation({ summary: 'Cliente envia avaliação pelo código seguro do agendamento' })
  async submitAppointmentReview(
    @Param('code') code: string,
    @Body() dto: SubmitAppointmentReviewDto,
  ) {
    return this.reviewsService.submitAppointmentReview(code, dto);
  }

  @Public()
  @Post('public/companies/:slug/reviews')
  @ApiOperation({ summary: 'Cliente envia avaliação geral na página pública' })
  async createPublicReview(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createPublicReview(slug, dto);
  }

  @Public()
  @Get('public/companies/:slug/reviews')
  @ApiOperation({ summary: 'Buscar média e depoimentos para a página pública' })
  async getPublicReviews(@Param('slug') slug: string) {
    return this.reviewsService.getPublicReviews(slug);
  }

  // =========================================================================
  // GESTÃO INTERNA (PAINEL DO ESTABELECIMENTO)
  // =========================================================================
  @Get('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as avaliações do estabelecimento' })
  async listReviews(@Req() req: any) {
    return this.reviewsService.listReviews(req.companyId);
  }

  @Patch('reviews/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar ou ocultar avaliação' })
  async toggleApproval(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.reviewsService.toggleApproval(req.companyId, id);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir avaliação' })
  async deleteReview(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.reviewsService.deleteReview(req.companyId, id);
  }
}

