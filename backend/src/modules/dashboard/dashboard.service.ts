import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AppointmentStatus, SubscriptionStatus } from '@prisma/client';
import { endOfDay, startOfDay, startOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // DASHBOARD DA EMPRESA (TENANT)
  // =========================================================================
  async getCompanyDashboard(companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Identificador da empresa não informado ou sessão sem empresa vinculada');
    }
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const fourteenDaysAgoStart = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

    const [
      todayCount,
      todayRevenueAppointments,
      upcomingCount,
      completedMonthCount,
      cancelledMonthCount,
      clientsCount,
      monthAppointments,
      company,
      totalProducts,
      allActiveProducts,
      waitlistCount,
      past14DaysAppointments,
    ] = await Promise.all([
      // Agendamentos de hoje
      this.prisma.appointment.count({
        where: {
          companyId,
          startDateTime: { gte: todayStart, lte: todayEnd },
          status: { not: AppointmentStatus.CANCELLED },
        },
      }),
      // Receita de hoje (confirmados e concluídos)
      this.prisma.appointment.findMany({
        where: {
          companyId,
          startDateTime: { gte: todayStart, lte: todayEnd },
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
        },
        select: { priceAtBooking: true },
      }),
      // Próximos agendamentos
      this.prisma.appointment.count({
        where: {
          companyId,
          startDateTime: { gt: now },
          status: AppointmentStatus.CONFIRMED,
        },
      }),
      // Concluídos no mês
      this.prisma.appointment.count({
        where: {
          companyId,
          startDateTime: { gte: monthStart },
          status: AppointmentStatus.COMPLETED,
        },
      }),
      // Cancelados no mês
      this.prisma.appointment.count({
        where: {
          companyId,
          startDateTime: { gte: monthStart },
          status: AppointmentStatus.CANCELLED,
        },
      }),
      // Total de clientes
      this.prisma.client.count({
        where: { companyId },
      }),
      // Receita estimada no mês
      this.prisma.appointment.findMany({
        where: {
          companyId,
          startDateTime: { gte: monthStart },
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
        },
        select: { priceAtBooking: true },
      }),
      // Assinatura e limites
      this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      }),
      // Total de produtos no estoque
      this.prisma.product.count({
        where: { companyId, isActive: true, isArchived: false },
      }),
      // Produtos ativos para checagem de estoque baixo baseado no estoque mínimo
      this.prisma.product.findMany({
        where: { companyId, isActive: true, isArchived: false },
        orderBy: { stock: 'asc' },
        select: { id: true, name: true, stock: true, minStock: true, unit: true, price: true, category: true },
      }),
      // Clientes na lista de espera aguardando vaga
      this.prisma.waitlistEntry.count({
        where: { companyId, status: 'PENDING' },
      }),
      // Histórico dos últimos 14 dias para gráfico
      this.prisma.appointment.findMany({
        where: {
          companyId,
          startDateTime: { gte: fourteenDaysAgoStart, lte: todayEnd },
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
        },
        select: { startDateTime: true, priceAtBooking: true },
      }),
    ]);

    const lowStockList = allActiveProducts.filter(
      (p) => p.stock <= p.minStock || (p.minStock === 0 && p.stock <= 5),
    );
    const lowStockProducts = lowStockList.length;
    const lowStockItems = lowStockList.slice(0, 5);

    const todayRevenue = todayRevenueAppointments.reduce(
      (acc, app) => acc + Number(app.priceAtBooking),
      0,
    );

    const estimatedRevenue = monthAppointments.reduce(
      (acc, app) => acc + Number(app.priceAtBooking),
      0,
    );

    // Montar série dos últimos 14 dias para o gráfico
    const chartData: any[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = startOfDay(d).getTime();
      const dayEndVal = endOfDay(d).getTime();
      const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      const appsInDay = past14DaysAppointments.filter((app) => {
        const time = new Date(app.startDateTime).getTime();
        return time >= dayStart && time <= dayEndVal;
      });

      const dayRevenue = appsInDay.reduce((acc, a) => acc + Number(a.priceAtBooking), 0);

      chartData.push({
        date: d.toISOString().split('T')[0],
        dayLabel: dayStr,
        appointments: appsInDay.length,
        revenue: Math.round(dayRevenue * 100) / 100,
      });
    }

    // Serviços mais agendados
    const topServices = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        companyId,
        startDateTime: { gte: monthStart },
        status: { not: AppointmentStatus.CANCELLED },
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

    const populatedTopServices = await Promise.all(
      topServices.map(async (item) => {
        const service = await this.prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { name: true, price: true },
        });
        return {
          serviceName: service?.name || 'Serviço Desconhecido',
          price: service?.price || 0,
          bookingsCount: item._count.id,
        };
      }),
    );

    return {
      metrics: {
        todayAppointments: todayCount,
        todayRevenue,
        upcomingAppointments: upcomingCount,
        completedThisMonth: completedMonthCount,
        cancelledThisMonth: cancelledMonthCount,
        totalClients: clientsCount,
        estimatedRevenueThisMonth: estimatedRevenue,
        waitlistPending: waitlistCount,
      },
      inventory: {
        totalProducts,
        lowStockCount: lowStockProducts,
        lowStockItems,
      },
      chartData,
      topServices: populatedTopServices,
      subscription: {
        status: company?.subscription?.status || null,
        planName: company?.subscription?.plan?.name || null,
        periodEnd: company?.subscription?.currentPeriodEnd || null,
      },
    };
  }

  // =========================================================================
  // DASHBOARD DO SUPER ADMIN (VISÃO GERAL DO SAAS)
  // =========================================================================
  async getSuperAdminDashboard() {
    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      activeSubscriptions,
      pastDueSubscriptions,
      allActiveSubs,
      recentPayments,
      plansDistribution,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { isActive: true } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.TRIALING } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.PAST_DUE } }),
      // MRR: soma de todas as assinaturas ativas
      this.prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        select: { amount: true, billingCycle: true },
      }),
      // Últimos pagamentos
      this.prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { name: true, slug: true },
          },
        },
      }),
      // Distribuição por planos
      this.prisma.plan.findMany({
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // Cálculo do MRR (Monthly Recurring Revenue)
    // Se a assinatura for ANUAL, dividimos por 12 para normalizar na receita mensal
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
}

