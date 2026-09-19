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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanyDashboard(companyId) {
        if (!companyId) {
            throw new common_1.BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
        }
        const now = new Date();
        const todayStart = (0, date_fns_1.startOfDay)(now);
        const todayEnd = (0, date_fns_1.endOfDay)(now);
        const monthStart = (0, date_fns_1.startOfMonth)(now);
        const [todayCount, upcomingCount, completedMonthCount, cancelledMonthCount, clientsCount, monthAppointments, company,] = await Promise.all([
            this.prisma.appointment.count({
                where: {
                    companyId,
                    startDateTime: { gte: todayStart, lte: todayEnd },
                    status: { not: client_1.AppointmentStatus.CANCELLED },
                },
            }),
            this.prisma.appointment.count({
                where: {
                    companyId,
                    startDateTime: { gt: now },
                    status: client_1.AppointmentStatus.CONFIRMED,
                },
            }),
            this.prisma.appointment.count({
                where: {
                    companyId,
                    startDateTime: { gte: monthStart },
                    status: client_1.AppointmentStatus.COMPLETED,
                },
            }),
            this.prisma.appointment.count({
                where: {
                    companyId,
                    startDateTime: { gte: monthStart },
                    status: client_1.AppointmentStatus.CANCELLED,
                },
            }),
            this.prisma.client.count({
                where: { companyId },
            }),
            this.prisma.appointment.findMany({
                where: {
                    companyId,
                    startDateTime: { gte: monthStart },
                    status: { in: [client_1.AppointmentStatus.CONFIRMED, client_1.AppointmentStatus.COMPLETED] },
                },
                select: { priceAtBooking: true },
            }),
            this.prisma.company.findUnique({
                where: { id: companyId },
                include: {
                    subscription: {
                        include: { plan: true },
                    },
                },
            }),
        ]);
        const estimatedRevenue = monthAppointments.reduce((acc, app) => acc + Number(app.priceAtBooking), 0);
        const topServices = await this.prisma.appointment.groupBy({
            by: ['serviceId'],
            where: {
                companyId,
                startDateTime: { gte: monthStart },
                status: { not: client_1.AppointmentStatus.CANCELLED },
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 5,
        });
        const populatedTopServices = await Promise.all(topServices.map(async (item) => {
            const service = await this.prisma.service.findUnique({
                where: { id: item.serviceId },
                select: { name: true, price: true },
            });
            return {
                serviceName: service?.name || 'Serviço Desconhecido',
                price: service?.price || 0,
                bookingsCount: item._count.id,
            };
        }));
        return {
            metrics: {
                todayAppointments: todayCount,
                upcomingAppointments: upcomingCount,
                completedThisMonth: completedMonthCount,
                cancelledThisMonth: cancelledMonthCount,
                totalClients: clientsCount,
                estimatedRevenueThisMonth: estimatedRevenue,
            },
            topServices: populatedTopServices,
            subscription: {
                status: company?.subscription?.status || null,
                planName: company?.subscription?.plan?.name || null,
                periodEnd: company?.subscription?.currentPeriodEnd || null,
            },
        };
    }
    async getSuperAdminDashboard() {
        const [totalCompanies, activeCompanies, trialCompanies, activeSubscriptions, pastDueSubscriptions, allActiveSubs, recentPayments, plansDistribution,] = await Promise.all([
            this.prisma.company.count(),
            this.prisma.company.count({ where: { isActive: true } }),
            this.prisma.subscription.count({ where: { status: client_1.SubscriptionStatus.TRIALING } }),
            this.prisma.subscription.count({ where: { status: client_1.SubscriptionStatus.ACTIVE } }),
            this.prisma.subscription.count({ where: { status: client_1.SubscriptionStatus.PAST_DUE } }),
            this.prisma.subscription.findMany({
                where: { status: client_1.SubscriptionStatus.ACTIVE },
                select: { amount: true, billingCycle: true },
            }),
            this.prisma.payment.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    company: {
                        select: { name: true, slug: true },
                    },
                },
            }),
            this.prisma.plan.findMany({
                include: {
                    _count: {
                        select: { subscriptions: true },
                    },
                },
                orderBy: { sortOrder: 'asc' },
            }),
        ]);
        const mrr = allActiveSubs.reduce((acc, sub) => {
            const val = Number(sub.amount);
            return acc + (sub.billingCycle === 'YEARLY' ? val / 12 : val);
        }, 0);
        return {
            companies: {
                total: totalCompanies,
                active: activeCompanies,
                trial: trialCompanies,
            },
            subscriptions: {
                active: activeSubscriptions,
                pastDue: pastDueSubscriptions,
            },
            financial: {
                mrr: Number(mrr.toFixed(2)),
                annualRunRate: Number((mrr * 12).toFixed(2)),
            },
            plansDistribution: plansDistribution.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                priceMonthly: p.priceMonthly,
                activeSubscribers: p._count.subscriptions,
            })),
            recentPayments,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map