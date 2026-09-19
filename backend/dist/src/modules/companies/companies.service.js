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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CompaniesService = class CompaniesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompany(companyId) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        return company;
    }
    async updateCompany(companyId, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const existing = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        let settings = existing.settings;
        if (dto.settings) {
            settings = {
                ...settings,
                ...dto.settings,
            };
        }
        return this.prisma.company.update({
            where: { id: companyId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.phone && { phone: dto.phone }),
                ...(dto.email && { email: dto.email }),
                ...(dto.document !== undefined && { document: dto.document }),
                ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
                ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl }),
                settings,
            },
        });
    }
    async getMembers(companyId) {
        return this.prisma.companyMember.findMany({
            where: { companyId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getCompanyPublic(slug) {
        const company = await this.prisma.company.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                phone: true,
                email: true,
                logoUrl: true,
                coverUrl: true,
                settings: true,
                isActive: true,
                professionals: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        bio: true,
                        avatarUrl: true,
                        phone: true,
                    },
                },
                services: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        durationMinutes: true,
                        price: true,
                        category: true,
                        imageUrl: true,
                        sortOrder: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!company || !company.isActive) {
            throw new common_1.NotFoundException('Empresa não encontrada ou inativa');
        }
        return company;
    }
    async listAllCompanies() {
        return this.prisma.company.findMany({
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
                _count: {
                    select: {
                        appointments: true,
                        professionals: true,
                        clients: true,
                        members: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async toggleCompanyStatus(companyId, isActive) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        return this.prisma.company.update({
            where: { id: companyId },
            data: { isActive },
        });
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map