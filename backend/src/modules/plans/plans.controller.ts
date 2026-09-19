import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Plans')
@Controller()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Listar planos públicos ativos para contratação' })
  listPublicPlans() {
    return this.plansService.listPublicPlans();
  }

  @ApiBearerAuth('JWT')
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/plans')
  @ApiOperation({ summary: '[Super Admin] Listar todos os planos do SaaS com estatísticas' })
  listAllPlans() {
    return this.plansService.listAllPlans();
  }

  @ApiBearerAuth('JWT')
  @Roles(Role.SUPER_ADMIN)
  @Post('admin/plans')
  @ApiOperation({ summary: '[Super Admin] Criar novo plano de assinatura' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.plansService.createPlan(dto);
  }

  @ApiBearerAuth('JWT')
  @Roles(Role.SUPER_ADMIN)
  @Patch('admin/plans/:id')
  @ApiOperation({ summary: '[Super Admin] Atualizar plano existente' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.updatePlan(id, dto);
  }

  @ApiBearerAuth('JWT')
  @Roles(Role.SUPER_ADMIN)
  @Delete('admin/plans/:id')
  @ApiOperation({ summary: '[Super Admin] Excluir ou desativar plano' })
  deletePlan(@Param('id') id: string) {
    return this.plansService.deletePlan(id);
  }
}

