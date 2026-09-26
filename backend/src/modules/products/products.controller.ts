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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  CreateStockMovementDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';

@ApiTags('Estoque & Insumos')
@ApiBearerAuth('JWT')
@RequireFeature('inventory')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter métricas de estoque (Ativos, Baixo Estoque, Arquivados)' })
  getStats(@Req() req: any) {
    return this.productsService.getStats(req.companyId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar histórico de movimentações de estoque' })
  listMovements(
    @Req() req: any,
    @Query('productId') productId?: string,
  ) {
    return this.productsService.listMovements(req.companyId, productId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar itens de estoque com filtros' })
  listProducts(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('isArchived') isArchived?: string,
  ) {
    return this.productsService.listProducts(req.companyId, {
      search,
      type,
      isArchived: isArchived === 'true',
    });
  }

  @Post('alert-all')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Enviar alerta consolidado de reposição via WhatsApp para todos os itens em estoque baixo' })
  sendBulkRestockAlert(@Req() req: any) {
    return this.productsService.sendBulkRestockAlert(req.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um item' })
  getProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.getProduct(req.companyId, id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Cadastrar novo item de estoque / insumo' })
  createProduct(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productsService.createProduct(req.companyId, dto);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Atualizar dados de um item' })
  updateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(req.companyId, id, dto);
  }

  @Patch(':id/archive')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Arquivar ou desarquivar um item de estoque' })
  toggleArchive(@Req() req: any, @Param('id') id: string) {
    return this.productsService.toggleArchive(req.companyId, id);
  }

  @Post(':id/movements')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Registrar movimentação de estoque (Entrada, Saída ou Ajuste)' })
  createMovement(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.productsService.createMovement(req.companyId, id, dto);
  }

  @Post(':id/alert')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Enviar alerta de reposição via WhatsApp para os profissionais' })
  sendRestockAlert(@Req() req: any, @Param('id') id: string) {
    return this.productsService.sendRestockAlert(req.companyId, id);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Excluir item de estoque' })
  deleteProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.deleteProduct(req.companyId, id);
  }
}
