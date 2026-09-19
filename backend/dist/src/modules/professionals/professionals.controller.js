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
exports.ProfessionalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const professionals_service_1 = require("./professionals.service");
const professional_dto_1 = require("./dto/professional.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const client_1 = require("@prisma/client");
let ProfessionalsController = class ProfessionalsController {
    professionalsService;
    constructor(professionalsService) {
        this.professionalsService = professionalsService;
    }
    listProfessionals(req) {
        return this.professionalsService.listProfessionals(req.companyId);
    }
    getProfessional(req, id) {
        return this.professionalsService.getProfessional(req.companyId, id);
    }
    createProfessional(req, dto) {
        return this.professionalsService.createProfessional(req.companyId, dto);
    }
    updateProfessional(req, id, dto) {
        return this.professionalsService.updateProfessional(req.companyId, id, dto);
    }
    deleteProfessional(req, id) {
        return this.professionalsService.deleteProfessional(req.companyId, id);
    }
    getPublicProfessional(companySlug, professionalSlug) {
        return this.professionalsService.getPublicProfessional(companySlug, professionalSlug);
    }
};
exports.ProfessionalsController = ProfessionalsController;
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('professionals'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os profissionais da empresa' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfessionalsController.prototype, "listProfessionals", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('professionals/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter detalhes de um profissional' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProfessionalsController.prototype, "getProfessional", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('professionals'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastrar novo profissional (valida limite do plano)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, professional_dto_1.CreateProfessionalDto]),
    __metadata("design:returntype", void 0)
], ProfessionalsController.prototype, "createProfessional", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('professionals/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar dados de um profissional' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, professional_dto_1.UpdateProfessionalDto]),
    __metadata("design:returntype", void 0)
], ProfessionalsController.prototype, "updateProfessional", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Delete)('professionals/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir ou inativar profissional' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProfessionalsController.prototype, "deleteProfessional", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/companies/:companySlug/professionals/:professionalSlug'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter página pública individual do profissional para agendamento direto' }),
    __param(0, (0, common_1.Param)('companySlug')),
    __param(1, (0, common_1.Param)('professionalSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProfessionalsController.prototype, "getPublicProfessional", null);
exports.ProfessionalsController = ProfessionalsController = __decorate([
    (0, swagger_1.ApiTags)('Professionals'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [professionals_service_1.ProfessionalsService])
], ProfessionalsController);
//# sourceMappingURL=professionals.controller.js.map