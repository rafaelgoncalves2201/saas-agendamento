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
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
let AvailabilityService = class AvailabilityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAvailabilities(companyId, professionalId) {
        return this.prisma.availability.findMany({
            where: {
                companyId,
                professionalId: professionalId || null,
            },
            orderBy: { dayOfWeek: 'asc' },
        });
    }
    async setAvailabilities(companyId, dto) {
        const profId = dto.professionalId || null;
        return this.prisma.$transaction(async (tx) => {
            await tx.availability.deleteMany({
                where: {
                    companyId,
                    professionalId: profId,
                },
            });
            if (dto.availabilities && dto.availabilities.length > 0) {
                await tx.availability.createMany({
                    data: dto.availabilities.map((item) => ({
                        companyId,
                        professionalId: profId,
                        dayOfWeek: item.dayOfWeek,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        breakStart: item.breakStart || null,
                        breakEnd: item.breakEnd || null,
                        isActive: item.isActive,
                    })),
                });
            }
            return tx.availability.findMany({
                where: { companyId, professionalId: profId },
                orderBy: { dayOfWeek: 'asc' },
            });
        });
    }
    async createBlockedTime(companyId, dto) {
        const start = new Date(dto.startDateTime);
        const end = new Date(dto.endDateTime);
        if (start >= end) {
            throw new common_1.BadRequestException('A data/hora inicial deve ser anterior à final');
        }
        return this.prisma.blockedTime.create({
            data: {
                companyId,
                professionalId: dto.professionalId || null,
                startDateTime: start,
                endDateTime: end,
                reason: dto.reason || null,
            },
        });
    }
    async listBlockedTimes(companyId, professionalId) {
        return this.prisma.blockedTime.findMany({
            where: {
                companyId,
                ...(professionalId && {
                    OR: [{ professionalId }, { professionalId: null }],
                }),
            },
            orderBy: { startDateTime: 'asc' },
        });
    }
    async deleteBlockedTime(companyId, id) {
        const blocked = await this.prisma.blockedTime.findFirst({
            where: { id, companyId },
        });
        if (!blocked) {
            throw new common_1.NotFoundException('Bloqueio não encontrado');
        }
        return this.prisma.blockedTime.delete({
            where: { id },
        });
    }
    async calculateAvailableSlots(companyId, query) {
        const service = await this.prisma.service.findFirst({
            where: { id: query.serviceId, companyId, isActive: true },
        });
        if (!service) {
            throw theoryNotFound('Serviço não encontrado ou inativo');
        }
        const professional = await this.prisma.professional.findFirst({
            where: { id: query.professionalId, companyId, isActive: true },
        });
        if (!professional) {
            throw theoryNotFound('Profissional não encontrado ou inativo');
        }
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        const settings = company?.settings || {};
        const timezone = settings.timezone || 'America/Sao_Paulo';
        const minNoticeMinutes = settings.minBookingNoticeMinutes || 60;
        const dateParts = query.date.split('-').map(Number);
        if (dateParts.length !== 3) {
            throw new common_1.BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
        }
        const [year, month, day] = dateParts;
        const referenceDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        const dayOfWeek = referenceDate.getUTCDay();
        let availabilities = await this.prisma.availability.findMany({
            where: {
                companyId,
                professionalId: professional.id,
                dayOfWeek,
                isActive: true,
            },
            orderBy: { startTime: 'asc' },
        });
        if (availabilities.length === 0) {
            availabilities = await this.prisma.availability.findMany({
                where: {
                    companyId,
                    professionalId: null,
                    dayOfWeek,
                    isActive: true,
                },
                orderBy: { startTime: 'asc' },
            });
        }
        if (availabilities.length === 0) {
            return {
                date: query.date,
                dayOfWeek,
                availableSlots: [],
                message: 'Profissional ou estabelecimento não atende nesta data',
            };
        }
        const parseTimeToDate = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            const dateLocal = new Date(year, month - 1, day, h, m, 0);
            return (0, date_fns_tz_1.fromZonedTime)(dateLocal, timezone);
        };
        const expirationLimit = new Date(Date.now() - 15 * 60 * 1000);
        await this.prisma.appointment.updateMany({
            where: {
                companyId,
                status: 'PENDING_PAYMENT',
                paidAt: null,
                createdAt: { lt: expirationLimit },
            },
            data: {
                status: 'CANCELLED',
                cancellationReason: 'Tempo de pagamento do Mercado Pago expirado (15 minutos)',
                cancelledAt: new Date(),
            },
        });
        const dayStartUtc = parseTimeToDate('00:00');
        const dayEndUtc = parseTimeToDate('23:59');
        const blockedTimes = await this.prisma.blockedTime.findMany({
            where: {
                companyId,
                OR: [
                    { professionalId: professional.id },
                    { professionalId: null },
                ],
                startDateTime: { lt: dayEndUtc },
                endDateTime: { gt: dayStartUtc },
            },
        });
        const appointments = await this.prisma.appointment.findMany({
            where: {
                companyId,
                professionalId: professional.id,
                status: { not: 'CANCELLED' },
                startDateTime: { lt: dayEndUtc },
                endDateTime: { gt: dayStartUtc },
            },
        });
        const duration = service.durationMinutes;
        const stepMinutes = duration >= 45 ? duration : Math.max(15, duration);
        const slots = [];
        const addedTimeSet = new Set();
        const now = new Date();
        const minBookingTime = (0, date_fns_1.addMinutes)(now, minNoticeMinutes);
        for (const avail of availabilities) {
            const workStart = parseTimeToDate(avail.startTime);
            const workEnd = parseTimeToDate(avail.endTime);
            let breakStart = null;
            let breakEnd = null;
            if (avail.breakStart && avail.breakEnd) {
                breakStart = parseTimeToDate(avail.breakStart);
                breakEnd = parseTimeToDate(avail.breakEnd);
            }
            let current = new Date(workStart.getTime());
            while (true) {
                const slotEnd = (0, date_fns_1.addMinutes)(current, duration);
                if ((0, date_fns_1.isAfter)(slotEnd, workEnd)) {
                    break;
                }
                const isInFutureWithNotice = (0, date_fns_1.isAfter)(current, minBookingTime);
                if (isInFutureWithNotice) {
                    let overlapsBreak = false;
                    if (breakStart && breakEnd) {
                        if ((0, date_fns_1.isBefore)(current, breakEnd) && (0, date_fns_1.isAfter)(slotEnd, breakStart)) {
                            overlapsBreak = true;
                        }
                    }
                    let overlapsBlocked = false;
                    if (!overlapsBreak) {
                        for (const b of blockedTimes) {
                            if ((0, date_fns_1.isBefore)(current, b.endDateTime) && (0, date_fns_1.isAfter)(slotEnd, b.startDateTime)) {
                                overlapsBlocked = true;
                                break;
                            }
                        }
                    }
                    let conflictingApp = null;
                    if (!overlapsBreak && !overlapsBlocked) {
                        for (const a of appointments) {
                            if ((0, date_fns_1.isBefore)(current, a.endDateTime) && (0, date_fns_1.isAfter)(slotEnd, a.startDateTime)) {
                                conflictingApp = a;
                                break;
                            }
                        }
                    }
                    if (!overlapsBreak && !overlapsBlocked && !conflictingApp) {
                        const localTime = (0, date_fns_tz_1.toZonedTime)(current, timezone);
                        const localEndTime = (0, date_fns_tz_1.toZonedTime)(slotEnd, timezone);
                        const timeFormatted = (0, date_fns_1.format)(localTime, 'HH:mm');
                        const endFormatted = (0, date_fns_1.format)(localEndTime, 'HH:mm');
                        if (!addedTimeSet.has(timeFormatted)) {
                            addedTimeSet.add(timeFormatted);
                            slots.push({
                                time: timeFormatted,
                                endTime: endFormatted,
                                label: `${timeFormatted} às ${endFormatted}`,
                                duration,
                                start: current.toISOString(),
                                end: slotEnd.toISOString(),
                            });
                        }
                        current = (0, date_fns_1.addMinutes)(current, stepMinutes);
                    }
                    else if (conflictingApp) {
                        current = new Date(conflictingApp.endDateTime.getTime());
                    }
                    else {
                        current = (0, date_fns_1.addMinutes)(current, 15);
                    }
                }
                else {
                    current = (0, date_fns_1.addMinutes)(current, stepMinutes);
                }
            }
        }
        slots.sort((a, b) => a.time.localeCompare(b.time));
        return {
            date: query.date,
            service: {
                id: service.id,
                name: service.name,
                durationMinutes: service.durationMinutes,
                price: service.price,
            },
            professional: {
                id: professional.id,
                name: professional.name,
            },
            timezone,
            availableSlots: slots,
        };
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AvailabilityService);
function theoryNotFound(msg) {
    return new common_1.NotFoundException(msg);
}
//# sourceMappingURL=availability.service.js.map