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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RescheduleAppointmentDto = exports.CancelAppointmentClientDto = exports.UpdateAppointmentStatusDto = exports.CreatePublicAppointmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreatePublicAppointmentDto {
    professionalId;
    serviceId;
    startDateTime;
    clientName;
    clientPhone;
    clientEmail;
    notes;
    couponCode;
}
exports.CreatePublicAppointmentDto = CreatePublicAppointmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-professional-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O profissional é obrigatório' }),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "professionalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-service-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O serviço é obrigatório' }),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-25T14:00:00.000Z', description: 'Data e hora em UTC ISO' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Data/hora inválida' }),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "startDateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mariana Lima' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Seu nome é obrigatório' }),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "clientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11988884444', description: 'WhatsApp com DDD' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Seu WhatsApp é obrigatório' }),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "clientPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mariana@gmail.com', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail inválido' }),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "clientEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Prefiro corte bem curto nas laterais', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'VERAO10', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePublicAppointmentDto.prototype, "couponCode", void 0);
class UpdateAppointmentStatusDto {
    status;
    cancellationReason;
}
exports.UpdateAppointmentStatusDto = UpdateAppointmentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AppointmentStatus, example: client_1.AppointmentStatus.COMPLETED }),
    (0, class_validator_1.IsEnum)(client_1.AppointmentStatus),
    __metadata("design:type", String)
], UpdateAppointmentStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cliente solicitou cancelamento por imprevisto', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppointmentStatusDto.prototype, "cancellationReason", void 0);
class CancelAppointmentClientDto {
    reason;
}
exports.CancelAppointmentClientDto = CancelAppointmentClientDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Tive um imprevisto no trabalho', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelAppointmentClientDto.prototype, "reason", void 0);
class RescheduleAppointmentDto {
    startDateTime;
    professionalId;
}
exports.RescheduleAppointmentDto = RescheduleAppointmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-28T09:30:00.000Z', description: 'Nova data e hora em formato ISO' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Data/hora de reagendamento inválida' }),
    __metadata("design:type", String)
], RescheduleAppointmentDto.prototype, "startDateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-professional-id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RescheduleAppointmentDto.prototype, "professionalId", void 0);
//# sourceMappingURL=appointment.dto.js.map