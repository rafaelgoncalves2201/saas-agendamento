import { PrismaService } from '../../database/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getCompanyDashboard(companyId: string): Promise<{
        metrics: {
            todayAppointments: number;
            todayRevenue: number;
            upcomingAppointments: number;
            completedThisMonth: number;
            cancelledThisMonth: number;
            totalClients: number;
            estimatedRevenueThisMonth: number;
            waitlistPending: number;
        };
        inventory: {
            totalProducts: number;
            lowStockCount: number;
            lowStockItems: {
                id: string;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string | null;
                unit: string;
                stock: number;
                minStock: number;
            }[];
        };
        chartData: any[];
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
            paidAt: Date | null;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            providerPaymentId: string;
            dueDate: Date;
            invoiceUrl: string | null;
            subscriptionId: string | null;
        })[];
    }>;
}
