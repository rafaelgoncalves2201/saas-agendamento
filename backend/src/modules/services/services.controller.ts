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
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Services')
@ApiBearerAuth('JWT')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços da empresa' })
  listServices(@Req() req: any) {
    return this.servicesService.listServices(req.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um serviço' })
  getService(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.getService(req.companyId, id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cadastrar novo serviço na empresa' })
  createService(@Req() req: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.createService(req.companyId, dto);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar serviço existente' })
  updateService(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.updateService(req.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Excluir ou desativar serviço' })
  deleteService(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.deleteService(req.companyId, id);
  }
}

