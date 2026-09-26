"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./database/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const companies_module_1 = require("./modules/companies/companies.module");
const plans_module_1 = require("./modules/plans/plans.module");
const services_module_1 = require("./modules/services/services.module");
const professionals_module_1 = require("./modules/professionals/professionals.module");
const availability_module_1 = require("./modules/availability/availability.module");
const appointments_module_1 = require("./modules/appointments/appointments.module");
const clients_module_1 = require("./modules/clients/clients.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const payments_module_1 = require("./modules/payments/payments.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const products_module_1 = require("./modules/products/products.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const coupons_module_1 = require("./modules/coupons/coupons.module");
const waitlist_module_1 = require("./modules/waitlist/waitlist.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const mercadopago_module_1 = require("./modules/mercadopago/mercadopago.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const subscription_guard_1 = require("./common/guards/subscription.guard");
const plan_feature_guard_1 = require("./common/guards/plan-feature.guard");
const tenant_interceptor_1 = require("./common/interceptors/tenant.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env'],
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            plans_module_1.PlansModule,
            services_module_1.ServicesModule,
            professionals_module_1.ProfessionalsModule,
            availability_module_1.AvailabilityModule,
            appointments_module_1.AppointmentsModule,
            clients_module_1.ClientsModule,
            subscriptions_module_1.SubscriptionsModule,
            payments_module_1.PaymentsModule,
            webhooks_module_1.WebhooksModule,
            dashboard_module_1.DashboardModule,
            products_module_1.ProductsModule,
            whatsapp_module_1.WhatsAppModule,
            coupons_module_1.CouponsModule,
            waitlist_module_1.WaitlistModule,
            reviews_module_1.ReviewsModule,
            mercadopago_module_1.MercadoPagoModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: subscription_guard_1.SubscriptionGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: plan_feature_guard_1.PlanFeatureGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: tenant_interceptor_1.TenantInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map