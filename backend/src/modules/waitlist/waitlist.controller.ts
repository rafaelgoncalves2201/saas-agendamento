import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistEntryDto, UpdateWaitlistStatusDto } from './dto/waitlist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role, WaitlistStatus } from '@prisma/client';

@ApiTags('Lista de Espera')
@Controller()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  // =========================================================================
  // ENDPOINT PÚBLICO (CLIENTE ENTRA NA FILA)
  // =========================================================================
  @Public()
  @Post('public/companies/:slug/waitlist')
  @ApiOperation({ summary: 'Cliente entra na lista de espera pela página pública' })
  async createPublicEntry(
    @Param('slug') slug: string,
    @Body() dto: CreateWaitlistEntryDto,
  ) {
    return this.waitlistService.createPublicEntry(slug, dto);
  }

  // =========================================================================
  // GESTÃO INTERNA (PAINEL DO ESTABELECIMENTO)
  // =========================================================================
  @Get('waitlist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar clientes na lista de espera' })
  async listEntries(
    @Req() req: any,
    @Query('status') status?: WaitlistStatus,
  ) {
    return this.waitlistService.listEntries(req.companyId, status);
  }

  @Patch('waitlist/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status do cliente na lista de espera' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWaitlistStatusDto,
  ) {
    return this.waitlistService.updateStatus(req.companyId, id, dto);
  }

  @Delete('waitlist/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir cliente da lista de espera' })
  async deleteEntry(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.waitlistService.deleteEntry(req.companyId, id);
  }
}

