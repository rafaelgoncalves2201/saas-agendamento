import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@ApiBearerAuth('JWT')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes da empresa com busca por nome, telefone ou e-mail' })
  listClients(@Req() req: any, @Query('search') search?: string) {
    return this.clientsService.listClients(req.companyId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter histórico e perfil detalhado do cliente' })
  getClient(@Req() req: any, @Param('id') id: string) {
    return this.clientsService.getClient(req.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados e anotações internas do cliente' })
  updateClient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(req.companyId, id, dto);
  }
}

