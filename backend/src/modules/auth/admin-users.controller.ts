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
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Super Admin - Usuários')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: '[Super Admin] Listar todos os usuários da plataforma' })
  listUsers() {
    return this.adminUsersService.listUsers();
  }

  @Post()
  @ApiOperation({ summary: '[Super Admin] Criar novo usuário' })
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Super Admin] Alterar dados, senha, permissão ou status de um usuário' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @Req() req: any,
  ) {
    return this.adminUsersService.updateUser(id, dto, req.user?.id || req.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Super Admin] Excluir usuário do sistema' })
  deleteUser(@Param('id') id: string, @Req() req: any) {
    return this.adminUsersService.deleteUser(id, req.user?.id || req.userId);
  }
}

