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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let PlansService = class PlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPublicPlans() {
        return this.prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async listAllPlans() {
        return this.prisma.plan.findMany({
            include: {
                _count: {
                    select: { subscriptions: true },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getPlan(id) {
        const plan = await this.prisma.plan.findUnique({
            where: { id },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Plano não encontrado');
        }
        return plan;
    }
    async createPlan(dto) {
        const existing = await this.prisma.plan.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Já existe um plano com este identificador (slug)');
        }
        return this.prisma.plan.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                priceMonthly: dto.priceMonthly,
                priceYearly: dto.priceYearly,
                maxProfessionals: dto.maxProfessionals,
                maxAppointmentsPerMonth: dto.maxAppointmentsPerMonth,
                maxWhatsappMessages: dto.maxWhatsappMessages,
                features: dto.features,
                sortOrder: dto.sortOrder || 0,
            },
        });
    }
    async updatePlan(id, dto) {
        await this.getPlan(id);
        return this.prisma.plan.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description && { description: dto.description }),
                ...(dto.priceMonthly !== undefined && { priceMonthly: dto.priceMonthly }),
                ...(dto.priceYearly !== undefined && { priceYearly: dto.priceYearly }),
                ...(dto.maxProfessionals !== undefined && { maxProfessionals: dto.maxProfessionals }),
                ...(dto.maxAppointmentsPerMonth !== undefined && { maxAppointmentsPerMonth: dto.maxAppointmentsPerMonth }),
                ...(dto.maxWhatsappMessages !== undefined && { maxWhatsappMessages: dto.maxWhatsappMessages }),
                ...(dto.features && { features: dto.features }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            },
        });
    }
    async deletePlan(id) {
        const plan = await this.getPlan(id);
        const activeSubscriptions = await this.prisma.subscription.count({
            where: { planId: id, status: 'ACTIVE' },
        });
        if (activeSubscriptions > 0) {
            return this.prisma.plan.update({
                where: { id },
                data: { isActive: false },
            });
        }
        return this.prisma.plan.delete({
            where: { id },
        });
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlansService);
//# sourceMappingURL=plans.service.js.map