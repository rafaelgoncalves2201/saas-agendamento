import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { PlansModule } from './modules/plans/plans.module';
import { ServicesModule } from './modules/services/services.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProductsModule } from './modules/products/products.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { PlanFeatureGuard } from './common/guards/plan-feature.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    PlansModule,
    ServicesModule,
    ProfessionalsModule,
    AvailabilityModule,
    AppointmentsModule,
    ClientsModule,
    SubscriptionsModule,
    PaymentsModule,
    WebhooksModule,
    DashboardModule,
    ProductsModule,
    WhatsAppModule,
    CouponsModule,
    WaitlistModule,
    ReviewsModule,
    MercadoPagoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PlanFeatureGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
