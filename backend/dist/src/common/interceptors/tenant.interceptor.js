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
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let TenantInterceptor = class TenantInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return next.handle();
        }
        if (user.role === client_1.Role.SUPER_ADMIN) {
            const explicitCompanyId = request.headers['x-tenant-id'];
            if (explicitCompanyId) {
                request.companyId = explicitCompanyId;
                return next.handle();
            }
            if (user.companyId) {
                request.companyId = user.companyId;
                return next.handle();
            }
            return (0, rxjs_1.from)(this.prisma.company.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            })).pipe((0, operators_1.mergeMap)((activeCompany) => {
                if (activeCompany) {
                    request.companyId = activeCompany.id;
                }
                return next.handle();
            }));
        }
        if (!user.companyId) {
            throw new common_1.UnauthorizedException('Empresa não vinculada à sessão do usuário');
        }
        request.companyId = user.companyId;
        return next.handle();
    }
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantInterceptor);
//# sourceMappingURL=tenant.interceptor.js.map