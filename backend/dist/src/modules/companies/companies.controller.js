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
exports.CompaniesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const companies_service_1 = require("./companies.service");
const update_company_dto_1 = require("./dto/update-company.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let CompaniesController = class CompaniesController {
    companiesService;
    constructor(companiesService) {
        this.companiesService = companiesService;
    }
    getMyCompany(req) {
        return this.companiesService.getCompany(req.companyId);
    }
    updateMyCompany(req, dto) {
        return this.companiesService.updateCompany(req.companyId, dto);
    }
    getMembers(req) {
        return this.companiesService.getMembers(req.companyId);
    }
    getPublicCompany(slug) {
        return this.companiesService.getCompanyPublic(slug);
    }
    listAllCompanies() {
        return this.companiesService.listAllCompanies();
    }
    toggleCompanyStatus(id, isActive) {
        return this.companiesService.toggleCompanyStatus(id, isActive);
    }
    changeCompanyPlan(id, planId, status, months) {
        return this.companiesService.changeCompanyPlan(id, planId, status, months);
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('companies/my-company'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter dados da empresa da sessão autenticada' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMyCompany", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('companies/my-company'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar dados e configurações da empresa' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateMyCompany", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('companies/members'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Listar membros vinculados à empresa' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMembers", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/companies/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter dados públicos da empresa para página de agendamento' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getPublicCompany", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('admin/companies'),
    (0, swagger_1.ApiOperation)({ summary: '[Super Admin] Listar todas as empresas cadastradas no SaaS' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "listAllCompanies", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('admin/companies/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: '[Super Admin] Ativar ou suspender empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "toggleCompanyStatus", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('admin/companies/:id/plan'),
    (0, swagger_1.ApiOperation)({ summary: '[Super Admin] Alterar plano e status da assinatura da empresa' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('planId')),
    __param(2, (0, common_1.Body)('status')),
    __param(3, (0, common_1.Body)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "changeCompanyPlan", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, swagger_1.ApiTags)('Companies'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map