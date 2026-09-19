import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter métricas operacionais e financeiras da empresa autenticada' })
  getCompanyDashboard(@Req() req: any) {
    return this.dashboardService.getCompanyDashboard(req.companyId);
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('admin/dashboard')
  @ApiOperation({ summary: '[Super Admin] Obter métricas globais da plataforma (MRR, empresas, faturamento)' })
  getSuperAdminDashboard() {
    return this.dashboardService.getSuperAdminDashboard();
  }
}

