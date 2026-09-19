import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getCompanyDashboard(req: any): Promise<{
        metrics: {
            todayAppointments: number;
            upcomingAppointments: number;
            completedThisMonth: number;
            cancelledThisMonth: number;
            totalClients: number;
            estimatedRevenueThisMonth: number;
        };
        topServices: {
            serviceName: string;
            price: number | import("@prisma/client/runtime/library").Decimal;
            bookingsCount: number;
        }[];
        subscription: {
            status: import(".prisma/client").$Enums.SubscriptionStatus | null;
            planName: string | null;
            periodEnd: Date | null;
        };
    }>;
    getSuperAdminDashboard(): Promise<{
        companies: {
            total: number;
            active: number;
            trial: number;
        };
        subscriptions: {
            active: number;
            pastDue: number;
        };
        financial: {
            mrr: number;
            annualRunRate: number;
        };
        plansDistribution: {
            id: string;
            name: string;
            slug: string;
            priceMonthly: import("@prisma/client/runtime/library").Decimal;
            activeSubscribers: number;
        }[];
        recentPayments: ({
            company: {
                name: string;
                slug: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            providerPaymentId: string;
            dueDate: Date;
            paidAt: Date | null;
            invoiceUrl: string | null;
            subscriptionId: string | null;
        })[];
    }>;
}
