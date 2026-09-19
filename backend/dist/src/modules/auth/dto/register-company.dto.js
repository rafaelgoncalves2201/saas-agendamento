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
exports.RegisterCompanyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterCompanyDto {
    companyName;
    companySlug;
    companyPhone;
    companyDocument;
    ownerName;
    ownerEmail;
    ownerPassword;
}
exports.RegisterCompanyDto = RegisterCompanyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Studio Beleza Pura', description: 'Nome fantasia da empresa' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O nome da empresa é obrigatório' }),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'studio-beleza-pura', description: 'Slug único da empresa para link público' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O slug da empresa é obrigatório' }),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "companySlug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11999998888', description: 'WhatsApp da empresa' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O telefone/WhatsApp da empresa é obrigatório' }),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "companyPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12.345.678/0001-90', required: false, description: 'CNPJ ou CPF da empresa' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "companyDocument", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Maria da Silva', description: 'Nome completo do proprietário' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O nome do proprietário é obrigatório' }),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'maria@studiobelezapura.com.br', description: 'E-mail de acesso do proprietário' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Formato de e-mail inválido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O e-mail é obrigatório' }),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "ownerEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SenhaSegura@2026', description: 'Senha de acesso' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'A senha é obrigatória' }),
    (0, class_validator_1.MinLength)(6, { message: 'A senha deve conter pelo menos 6 caracteres' }),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "ownerPassword", void 0);
//# sourceMappingURL=register-company.dto.js.map