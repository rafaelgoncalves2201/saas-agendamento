import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, SubscriptionStatus } from '@prisma/client';

@ApiTags('Companies')
@Controller()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @ApiBearerAuth('JWT')
  @Get('companies/my-company')
  @ApiOperation({ summary: 'Obter dados da empresa da sessão autenticada' })
  getMyCompany(@Req() req: any) {
    return this.companiesService.getCompany(req.companyId);
  }

  @ApiBearerAuth('JWT')
  @Patch('companies/my-company')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar dados e configurações da empresa' })
  updateMyCompany(@Req() req: any, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateCompany(req.companyId, dto);
  }

  @ApiBearerAuth('JWT')
  @Get('companies/members')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar membros vinculados à empresa' })
  getMembers(@Req() req: any) {
    return this.companiesService.getMembers(req.companyId);
  }

  @Public()
  @Get('public/companies/:slug')
  @ApiOperation({ summary: 'Obter dados públicos da empresa para página de agendamento' })
  getPublicCompany(@Param('slug') slug: string) {
    return this.companiesService.getCompanyPublic(slug);
  }

  // Super Admin Endpoints
  @ApiBearerAuth('JWT')
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/companies')
  @ApiOperation({ summary: '[Super Admin] Listar todas as empresas cadastradas no SaaS' })
  listAllCompanies() {
    return this.companiesService.listAllCompanies();
  }

  @ApiBearerAuth('JWT')
  @Roles(Role.SUPER_ADMIN)
  @Patch('admin/companies/:id/status')
  @ApiOperation({ summary: '[Super Admin] Ativar ou suspender empresa' })
  toggleCompanyStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.companiesService.toggleCompanyStatus(id, isActive);
  }

  @ApiBearerAuth('JWT')
  @Roles(Role.SUPER_ADMIN)
  @Patch('admin/companies/:id/plan')
  @ApiOperation({ summary: '[Super Admin] Alterar plano e status da assinatura da empresa' })
  changeCompanyPlan(
    @Param('id') id: string,
    @Body('planId') planId: string,
    @Body('status') status?: SubscriptionStatus,
    @Body('months') months?: number,
  ) {
    return this.companiesService.changeCompanyPlan(id, planId, status, months);
  }
}

