import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Professionals')
@Controller()
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @ApiBearerAuth('JWT')
  @Get('professionals')
  @ApiOperation({ summary: 'Listar todos os profissionais da empresa' })
  listProfessionals(@Req() req: any) {
    return this.professionalsService.listProfessionals(req.companyId);
  }

  @ApiBearerAuth('JWT')
  @Get('professionals/:id')
  @ApiOperation({ summary: 'Obter detalhes de um profissional' })
  getProfessional(@Req() req: any, @Param('id') id: string) {
    return this.professionalsService.getProfessional(req.companyId, id);
  }

  @ApiBearerAuth('JWT')
  @Post('professionals')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cadastrar novo profissional (valida limite do plano)' })
  createProfessional(@Req() req: any, @Body() dto: CreateProfessionalDto) {
    return this.professionalsService.createProfessional(req.companyId, dto);
  }

  @ApiBearerAuth('JWT')
  @Patch('professionals/:id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar dados de um profissional' })
  updateProfessional(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.updateProfessional(req.companyId, id, dto);
  }

  @ApiBearerAuth('JWT')
  @Delete('professionals/:id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Excluir ou inativar profissional' })
  deleteProfessional(@Req() req: any, @Param('id') id: string) {
    return this.professionalsService.deleteProfessional(req.companyId, id);
  }

  @Public()
  @Get('public/companies/:companySlug/professionals/:professionalSlug')
  @ApiOperation({ summary: 'Obter página pública individual do profissional para agendamento direto' })
  getPublicProfessional(
    @Param('companySlug') companySlug: string,
    @Param('professionalSlug') professionalSlug: string,
  ) {
    return this.professionalsService.getPublicProfessional(companySlug, professionalSlug);
  }
}

