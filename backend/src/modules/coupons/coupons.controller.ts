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
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Cupons de Desconto')
@Controller()
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // =========================================================================
  // GESTÃO INTERNA (PAINEL DO ESTABELECIMENTO)
  // =========================================================================
  @Get('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os cupons do estabelecimento' })
  async listCoupons(@Req() req: any) {
    return this.couponsService.listCoupons(req.companyId);
  }

  @Post('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo cupom de desconto' })
  async createCoupon(@Req() req: any, @Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(req.companyId, dto);
  }

  @Patch('coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar cupom de desconto' })
  async updateCoupon(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.updateCoupon(req.companyId, id, dto);
  }

  @Delete('coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir um cupom de desconto' })
  async deleteCoupon(@Req() req: any, @Param('id') id: string) {
    return this.couponsService.deleteCoupon(req.companyId, id);
  }

  @Patch('coupons/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar ou desativar cupom' })
  async toggleCoupon(@Req() req: any, @Param('id') id: string) {
    return this.couponsService.toggleCoupon(req.companyId, id);
  }

  // =========================================================================
  // ENDPOINT PÚBLICO (CHECKOUT DE AGENDAMENTO)
  // =========================================================================
  @Post('public/companies/:slug/validate-coupon')
  @ApiOperation({ summary: 'Validar cupom de desconto na página pública de agendamento' })
  async validatePublicCoupon(
    @Param('slug') slug: string,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.couponsService.validatePublicCoupon(slug, dto);
  }
}

