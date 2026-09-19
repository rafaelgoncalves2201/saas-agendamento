import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import {
  CreateBlockedTimeDto,
  QuerySlotsDto,
  SetAvailabilityDto,
} from './dto/availability.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Availability')
@Controller()
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiBearerAuth('JWT')
  @Get('availability')
  @ApiOperation({ summary: 'Consultar configurações de disponibilidade (empresa ou profissional)' })
  getAvailabilities(
    @Req() req: any,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.availabilityService.getAvailabilities(req.companyId, professionalId);
  }

  @ApiBearerAuth('JWT')
  @Roles(Role.COMPANY_ADMIN, Role.PROFESSIONAL, Role.SUPER_ADMIN)
  @Post('availability')
  @ApiOperation({ summary: 'Definir horários de disponibilidade' })
  setAvailabilities(@Req() req: any, @Body() dto: SetAvailabilityDto) {
    return this.availabilityService.setAvailabilities(req.companyId, dto);
  }

  @ApiBearerAuth('JWT')
  @Post('availability/blocked')
  @ApiOperation({ summary: 'Criar bloqueio de horário (folga, férias, compromisso)' })
  createBlockedTime(@Req() req: any, @Body() dto: CreateBlockedTimeDto) {
    return this.availabilityService.createBlockedTime(req.companyId, dto);
  }

  @ApiBearerAuth('JWT')
  @Get('availability/blocked')
  @ApiOperation({ summary: 'Listar horários bloqueados' })
  listBlockedTimes(
    @Req() req: any,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.availabilityService.listBlockedTimes(req.companyId, professionalId);
  }

  @ApiBearerAuth('JWT')
  @Delete('availability/blocked/:id')
  @ApiOperation({ summary: 'Excluir bloqueio de horário' })
  deleteBlockedTime(@Req() req: any, @Param('id') id: string) {
    return this.availabilityService.deleteBlockedTime(req.companyId, id);
  }

  @Public()
  @Get('public/companies/:slug/availability')
  @ApiOperation({ summary: 'Consultar horários livres disponíveis para agendamento público' })
  async getPublicAvailableSlots(
    @Param('slug') slug: string,
    @Query() query: QuerySlotsDto,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!company || !company.isActive) {
      throw new Error('Empresa não encontrada');
    }

    return this.availabilityService.calculateAvailableSlots(company.id, query);
  }
}

