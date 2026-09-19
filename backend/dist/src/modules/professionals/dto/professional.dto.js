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
exports.UpdateProfessionalDto = exports.CreateProfessionalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProfessionalDto {
    name;
    slug;
    email;
    phone;
    bio;
    avatarUrl;
    serviceIds;
}
exports.CreateProfessionalDto = CreateProfessionalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Carlos Barbeiro' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O nome do profissional é obrigatório' }),
    __metadata("design:type", String)
], CreateProfessionalDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'carlos-barbeiro', description: 'Identificador único do profissional para link público' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O slug é obrigatório' }),
    __metadata("design:type", String)
], CreateProfessionalDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'carlos@empresa.com', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => typeof o.email === 'string' && o.email.trim().length > 0),
    (0, class_validator_1.IsEmail)({}, { message: 'Formato de e-mail inválido' }),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)),
    __metadata("design:type", String)
], CreateProfessionalDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11999990000', description: 'WhatsApp do profissional' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O telefone/WhatsApp é obrigatório' }),
    __metadata("design:type", String)
], CreateProfessionalDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Especialista em cortes modernos e barba alinhada', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProfessionalDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://images.unsplash.com/photo-barber.png', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProfessionalDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['uuid-service-1', 'uuid-service-2'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateProfessionalDto.prototype, "serviceIds", void 0);
class UpdateProfessionalDto {
    name;
    slug;
    email;
    phone;
    bio;
    avatarUrl;
    serviceIds;
    isActive;
}
exports.UpdateProfessionalDto = UpdateProfessionalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => typeof o.email === 'string' && o.email.trim().length > 0),
    (0, class_validator_1.IsEmail)({}, { message: 'Formato de e-mail inválido' }),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)),
    __metadata("design:type", String)
], UpdateProfessionalDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateProfessionalDto.prototype, "serviceIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProfessionalDto.prototype, "isActive", void 0);
//# sourceMappingURL=professional.dto.js.map