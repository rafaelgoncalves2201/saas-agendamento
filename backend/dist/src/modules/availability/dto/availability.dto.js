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
exports.QuerySlotsDto = exports.CreateBlockedTimeDto = exports.SetAvailabilityDto = exports.AvailabilityItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AvailabilityItemDto {
    dayOfWeek;
    startTime;
    endTime;
    breakStart;
    breakEnd;
    isActive;
}
exports.AvailabilityItemDto = AvailabilityItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '0 = Domingo, 1 = Segunda ... 6 = Sábado' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], AvailabilityItemDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '08:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AvailabilityItemDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '18:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AvailabilityItemDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12:00', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AvailabilityItemDto.prototype, "breakStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '13:00', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AvailabilityItemDto.prototype, "breakEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AvailabilityItemDto.prototype, "isActive", void 0);
class SetAvailabilityDto {
    professionalId;
    availabilities;
}
exports.SetAvailabilityDto = SetAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'ID do profissional (omitir para horário padrão da empresa)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetAvailabilityDto.prototype, "professionalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AvailabilityItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AvailabilityItemDto),
    __metadata("design:type", Array)
], SetAvailabilityDto.prototype, "availabilities", void 0);
class CreateBlockedTimeDto {
    professionalId;
    startDateTime;
    endDateTime;
    reason;
}
exports.CreateBlockedTimeDto = CreateBlockedTimeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'ID do profissional (omitir para bloqueio geral da empresa)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBlockedTimeDto.prototype, "professionalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-25T14:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBlockedTimeDto.prototype, "startDateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-25T16:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBlockedTimeDto.prototype, "endDateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Consulta médica', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBlockedTimeDto.prototype, "reason", void 0);
class QuerySlotsDto {
    professionalId;
    serviceId;
    date;
}
exports.QuerySlotsDto = QuerySlotsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-professional-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuerySlotsDto.prototype, "professionalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-service-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuerySlotsDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-25', description: 'Data no formato YYYY-MM-DD' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuerySlotsDto.prototype, "date", void 0);
//# sourceMappingURL=availability.dto.js.map