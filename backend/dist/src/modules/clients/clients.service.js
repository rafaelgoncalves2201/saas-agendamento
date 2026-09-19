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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ClientsService = class ClientsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listClients(companyId, search) {
        return this.prisma.client.findMany({
            where: {
                companyId,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: [{ lastAppointmentAt: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async getClient(companyId, id) {
        const client = await this.prisma.client.findFirst({
            where: { id, companyId },
            include: {
                appointments: {
                    include: {
                        service: true,
                        professional: true,
                    },
                    orderBy: { startDateTime: 'desc' },
                },
            },
        });
        if (!client) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return client;
    }
    async updateClient(companyId, id, dto) {
        await this.getClient(companyId, id);
        return this.prisma.client.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
            },
        });
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map