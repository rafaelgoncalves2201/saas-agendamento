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
import { AppointmentsService } from './appointments.service';
import {
  CancelAppointmentClientDto,
  CreatePublicAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointment.dto';
import { Public } from '../../common/decorators/public.decorator';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Public()
  @Post('public/companies/:slug/appointments')
  @ApiOperation({ summary: 'Realizar agendamento online público pelo cliente (sem login)' })
  createPublicAppointment(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicAppointmentDto,
  ) {
    return this.appointmentsService.createPublicAppointment(slug, dto);
  }

  @Public()
  @Get('public/appointments/:code')
  @ApiOperation({ summary: 'Consultar detalhes do agendamento através do código seguro' })
  getPublicAppointment(@Param('code') code: string) {
    return this.appointmentsService.getAppointmentByManagementCode(code);
  }

  @Public()
  @Post('public/appointments/:code/cancel')
  @ApiOperation({ summary: 'Cancelar agendamento através do link de autoatendimento' })
  cancelPublicAppointment(
    @Param('code') code: string,
    @Body() dto: CancelAppointmentClientDto,
  ) {
    return this.appointmentsService.cancelByManagementCode(code, dto);
  }

  @ApiBearerAuth('JWT')
  @Get('appointments')
  @ApiOperation({ summary: 'Listar agendamentos da empresa com filtros de data, status e profissional' })
  listAppointments(
    @Req() req: any,
    @Query('professionalId') professionalId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.listAppointments(req.companyId, {
      professionalId,
      status,
      startDate,
      endDate,
    });
  }

  @ApiBearerAuth('JWT')
  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento (concluir, cancelar, marcar no-show)' })
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateAppointmentStatus(req.companyId, id, dto);
  }

  @ApiBearerAuth('JWT')
  @Patch('appointments/:id/reschedule')
  @ApiOperation({ summary: 'Reagendar data e horário do atendimento pelo profissional ou empresa' })
  rescheduleAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(req.companyId, id, dto);
  }

  @ApiBearerAuth('JWT')
  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Excluir registro de agendamento' })
  deleteAppointment(@Req() req: any, @Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(req.companyId, id);
  }
}

