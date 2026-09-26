"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const appointments_service_1 = require("./appointments.service");
const appointment_dto_1 = require("./dto/appointment.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const client_1 = require("@prisma/client");
let AppointmentsController = class AppointmentsController {
    appointmentsService;
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    createPublicAppointment(slug, dto) {
        return this.appointmentsService.createPublicAppointment(slug, dto);
    }
    getPublicAppointment(code, paymentId, collectionId, status) {
        const effectivePaymentId = paymentId || collectionId;
        return this.appointmentsService.getAppointmentByManagementCode(code, effectivePaymentId, status);
    }
    cancelPublicAppointment(code, dto) {
        return this.appointmentsService.cancelByManagementCode(code, dto);
    }
    listAppointments(req, professionalId, status, startDate, endDate) {
        return this.appointmentsService.listAppointments(req.companyId, {
            professionalId,
            status,
            startDate,
            endDate,
        });
    }
    updateStatus(req, id, dto) {
        return this.appointmentsService.updateAppointmentStatus(req.companyId, id, dto);
    }
    rescheduleAppointment(req, id, dto) {
        return this.appointmentsService.rescheduleAppointment(req.companyId, id, dto);
    }
    deleteAppointment(req, id) {
        return this.appointmentsService.deleteAppointment(req.companyId, id);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('public/companies/:slug/appointments'),
    (0, swagger_1.ApiOperation)({ summary: 'Realizar agendamento online público pelo cliente (sem login)' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appointment_dto_1.CreatePublicAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "createPublicAppointment", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/appointments/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar detalhes do agendamento através do código seguro' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Query)('payment_id')),
    __param(2, (0, common_1.Query)('collection_id')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "getPublicAppointment", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('public/appointments/:code/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar agendamento através do link de autoatendimento' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appointment_dto_1.CancelAppointmentClientDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "cancelPublicAppointment", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('appointments'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar agendamentos da empresa com filtros de data, status e profissional' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('professionalId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "listAppointments", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('appointments/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar status do agendamento (concluir, cancelar, marcar no-show)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, appointment_dto_1.UpdateAppointmentStatusDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "updateStatus", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('appointments/:id/reschedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Reagendar data e horário do atendimento pelo profissional ou empresa' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, appointment_dto_1.RescheduleAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "rescheduleAppointment", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Delete)('appointments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir registro de agendamento' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "deleteAppointment", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, swagger_1.ApiTags)('Appointments'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map