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
exports.AvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const availability_service_1 = require("./availability.service");
const availability_dto_1 = require("./dto/availability.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let AvailabilityController = class AvailabilityController {
    availabilityService;
    prisma;
    constructor(availabilityService, prisma) {
        this.availabilityService = availabilityService;
        this.prisma = prisma;
    }
    getAvailabilities(req, professionalId) {
        return this.availabilityService.getAvailabilities(req.companyId, professionalId);
    }
    setAvailabilities(req, dto) {
        return this.availabilityService.setAvailabilities(req.companyId, dto);
    }
    createBlockedTime(req, dto) {
        return this.availabilityService.createBlockedTime(req.companyId, dto);
    }
    listBlockedTimes(req, professionalId) {
        return this.availabilityService.listBlockedTimes(req.companyId, professionalId);
    }
    deleteBlockedTime(req, id) {
        return this.availabilityService.deleteBlockedTime(req.companyId, id);
    }
    async getPublicAvailableSlots(slug, query) {
        const company = await this.prisma.company.findUnique({
            where: { slug },
            select: { id: true, isActive: true },
        });
        if (!company || !company.isActive) {
            throw new Error('Empresa não encontrada');
        }
        return this.availabilityService.calculateAvailableSlots(company.id, query);
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar configurações de disponibilidade (empresa ou profissional)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('professionalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getAvailabilities", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.PROFESSIONAL, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Definir horários de disponibilidade' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, availability_dto_1.SetAvailabilityDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "setAvailabilities", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('availability/blocked'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar bloqueio de horário (folga, férias, compromisso)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, availability_dto_1.CreateBlockedTimeDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "createBlockedTime", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('availability/blocked'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar horários bloqueados' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('professionalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "listBlockedTimes", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Delete)('availability/blocked/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir bloqueio de horário' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "deleteBlockedTime", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/companies/:slug/availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar horários livres disponíveis para agendamento público' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, availability_dto_1.QuerySlotsDto]),
    __metadata("design:returntype", Promise)
], AvailabilityController.prototype, "getPublicAvailableSlots", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('Availability'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService,
        prisma_service_1.PrismaService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map