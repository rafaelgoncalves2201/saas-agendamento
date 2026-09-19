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
exports.ProfessionalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ProfessionalsService = class ProfessionalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProfessionals(companyId) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        return this.prisma.professional.findMany({
            where: { companyId },
            include: {
                services: {
                    include: {
                        service: true,
                    },
                },
                availabilities: true,
                _count: {
                    select: { appointments: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getProfessional(companyId, id) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const professional = await this.prisma.professional.findFirst({
            where: { id, companyId },
            include: {
                services: {
                    include: {
                        service: true,
                    },
                },
                availabilities: true,
                blockedTimes: true,
            },
        });
        if (!professional) {
            throw new common_1.NotFoundException('Profissional não encontrado');
        }
        return professional;
    }
    async createProfessional(companyId, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const maxAllowed = company.subscription?.plan?.maxProfessionals || 1;
        const currentCount = await this.prisma.professional.count({
            where: { companyId, isActive: true },
        });
        if (currentCount >= maxAllowed) {
            throw new common_1.ForbiddenException(`Limite de profissionais atingido para o plano ${company.subscription?.plan?.name || 'atual'} (máximo ${maxAllowed}). Faça upgrade para adicionar mais profissionais.`);
        }
        const cleanSlug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
        const existingSlug = await this.prisma.professional.findUnique({
            where: {
                companyId_slug: {
                    companyId,
                    slug: cleanSlug,
                },
            },
        });
        if (existingSlug) {
            throw new common_1.ConflictException('Já existe um profissional com este identificador (slug) nesta empresa');
        }
        return this.prisma.$transaction(async (tx) => {
            const professional = await tx.professional.create({
                data: {
                    companyId,
                    name: dto.name,
                    slug: cleanSlug,
                    phone: dto.phone,
                    email: dto.email || null,
                    bio: dto.bio || null,
                    avatarUrl: dto.avatarUrl || null,
                },
            });
            if (dto.serviceIds && dto.serviceIds.length > 0) {
                await tx.professionalService.createMany({
                    data: dto.serviceIds.map((srvId) => ({
                        professionalId: professional.id,
                        serviceId: srvId,
                    })),
                });
            }
            const companyAvailabilities = await tx.availability.findMany({
                where: { companyId, professionalId: null, isActive: true },
            });
            for (const avail of companyAvailabilities) {
                await tx.availability.create({
                    data: {
                        companyId,
                        professionalId: professional.id,
                        dayOfWeek: avail.dayOfWeek,
                        startTime: avail.startTime,
                        endTime: avail.endTime,
                        breakStart: avail.breakStart,
                        breakEnd: avail.breakEnd,
                        isActive: true,
                    },
                });
            }
            return professional;
        });
    }
    async updateProfessional(companyId, id, dto) {
        await this.getProfessional(companyId, id);
        let cleanSlug = undefined;
        if (dto.slug) {
            cleanSlug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
            const existing = await this.prisma.professional.findFirst({
                where: {
                    companyId,
                    slug: cleanSlug,
                    NOT: { id },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('Este slug já está em uso por outro profissional');
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.professional.update({
                where: { id },
                data: {
                    ...(dto.name && { name: dto.name }),
                    ...(cleanSlug && { slug: cleanSlug }),
                    ...(dto.phone && { phone: dto.phone }),
                    ...(dto.email !== undefined && { email: dto.email }),
                    ...(dto.bio !== undefined && { bio: dto.bio }),
                    ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
                    ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                },
            });
            if (dto.serviceIds) {
                await tx.professionalService.deleteMany({
                    where: { professionalId: id },
                });
                if (dto.serviceIds.length > 0) {
                    await tx.professionalService.createMany({
                        data: dto.serviceIds.map((srvId) => ({
                            professionalId: id,
                            serviceId: srvId,
                        })),
                    });
                }
            }
            return updated;
        });
    }
    async deleteProfessional(companyId, id) {
        await this.getProfessional(companyId, id);
        const appointments = await this.prisma.appointment.count({
            where: { professionalId: id },
        });
        if (appointments > 0) {
            return this.prisma.professional.update({
                where: { id },
                data: { isActive: false },
            });
        }
        return this.prisma.professional.delete({
            where: { id },
        });
    }
    async getPublicProfessional(companySlug, professionalSlug) {
        const professional = await this.prisma.professional.findFirst({
            where: {
                slug: professionalSlug,
                company: { slug: companySlug, isActive: true },
                isActive: true,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                        coverUrl: true,
                        settings: true,
                    },
                },
                services: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                durationMinutes: true,
                                price: true,
                                imageUrl: true,
                                category: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });
        if (!professional) {
            throw new common_1.NotFoundException('Profissional não encontrado ou inativo');
        }
        return professional;
    }
};
exports.ProfessionalsService = ProfessionalsService;
exports.ProfessionalsService = ProfessionalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfessionalsService);
//# sourceMappingURL=professionals.service.js.map