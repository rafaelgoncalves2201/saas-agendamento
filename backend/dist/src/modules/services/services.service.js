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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ServicesService = class ServicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listServices(companyId) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        return this.prisma.service.findMany({
            where: { companyId },
            include: {
                professionals: {
                    include: {
                        professional: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getService(companyId, id) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const service = await this.prisma.service.findFirst({
            where: { id, companyId },
            include: {
                professionals: {
                    include: {
                        professional: true,
                    },
                },
            },
        });
        if (!service) {
            throw new common_1.NotFoundException('Serviço não encontrado');
        }
        return service;
    }
    async createService(companyId, dto) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        return this.prisma.$transaction(async (tx) => {
            const service = await tx.service.create({
                data: {
                    companyId,
                    name: dto.name,
                    description: dto.description || null,
                    durationMinutes: dto.durationMinutes,
                    price: dto.price,
                    category: dto.category || null,
                    imageUrl: dto.imageUrl || null,
                    sortOrder: dto.sortOrder || 0,
                },
            });
            if (dto.professionalIds && dto.professionalIds.length > 0) {
                await tx.professionalService.createMany({
                    data: dto.professionalIds.map((profId) => ({
                        professionalId: profId,
                        serviceId: service.id,
                    })),
                });
            }
            return service;
        });
    }
    async updateService(companyId, id, dto) {
        await this.getService(companyId, id);
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.service.update({
                where: { id },
                data: {
                    ...(dto.name && { name: dto.name }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
                    ...(dto.price !== undefined && { price: dto.price }),
                    ...(dto.category !== undefined && { category: dto.category }),
                    ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
                    ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                    ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                },
            });
            if (dto.professionalIds) {
                await tx.professionalService.deleteMany({
                    where: { serviceId: id },
                });
                if (dto.professionalIds.length > 0) {
                    await tx.professionalService.createMany({
                        data: dto.professionalIds.map((profId) => ({
                            professionalId: profId,
                            serviceId: id,
                        })),
                    });
                }
            }
            return updated;
        });
    }
    async deleteService(companyId, id) {
        await this.getService(companyId, id);
        const appointmentsCount = await this.prisma.appointment.count({
            where: { serviceId: id },
        });
        if (appointmentsCount > 0) {
            return this.prisma.service.update({
                where: { id },
                data: { isActive: false },
            });
        }
        return this.prisma.service.delete({
            where: { id },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map