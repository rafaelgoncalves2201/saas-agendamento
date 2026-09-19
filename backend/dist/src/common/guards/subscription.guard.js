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
exports.SubscriptionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const public_decorator_1 = require("../decorators/public.decorator");
let SubscriptionGuard = class SubscriptionGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return true;
        }
        if (user.role === client_1.Role.SUPER_ADMIN) {
            return true;
        }
        const companyId = request.companyId || user.companyId;
        if (!companyId) {
            return true;
        }
        const subscription = await this.prisma.subscription.findUnique({
            where: { companyId },
        });
        if (!subscription) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.PAYMENT_REQUIRED,
                error: 'Payment Required',
                message: 'Nenhuma assinatura encontrada para a sua empresa. Por favor, selecione um plano.',
                code: 'NO_SUBSCRIPTION',
            }, common_1.HttpStatus.PAYMENT_REQUIRED);
        }
        const now = new Date();
        if (subscription.status === client_1.SubscriptionStatus.ACTIVE) {
            if (now > subscription.currentPeriodEnd) {
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.PAYMENT_REQUIRED,
                    error: 'Payment Required',
                    message: 'O período da sua assinatura expirou. Regularize o pagamento para continuar utilizando o sistema.',
                    code: 'SUBSCRIPTION_EXPIRED',
                }, common_1.HttpStatus.PAYMENT_REQUIRED);
            }
            return true;
        }
        if (subscription.status === client_1.SubscriptionStatus.TRIALING) {
            if (subscription.trialEndsAt && now > subscription.trialEndsAt) {
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.PAYMENT_REQUIRED,
                    error: 'Payment Required',
                    message: 'Seu período de teste gratuito de 14 dias expirou. Assine um plano para continuar.',
                    code: 'TRIAL_EXPIRED',
                }, common_1.HttpStatus.PAYMENT_REQUIRED);
            }
            return true;
        }
        if (subscription.status === client_1.SubscriptionStatus.PAST_DUE) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.PAYMENT_REQUIRED,
                error: 'Payment Required',
                message: 'Sua assinatura está com pagamento pendente/em atraso. Por favor, regularize a fatura para liberar o acesso.',
                code: 'SUBSCRIPTION_PAST_DUE',
            }, common_1.HttpStatus.PAYMENT_REQUIRED);
        }
        if (subscription.status === client_1.SubscriptionStatus.SUSPENDED) {
            throw new common_1.ForbiddenException('O acesso da sua empresa foi suspenso pela administração da plataforma.');
        }
        if (subscription.status === client_1.SubscriptionStatus.CANCELED || subscription.status === client_1.SubscriptionStatus.EXPIRED) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.PAYMENT_REQUIRED,
                error: 'Payment Required',
                message: 'Sua assinatura foi cancelada ou expirou. Reative seu plano para continuar operando.',
                code: 'SUBSCRIPTION_INACTIVE',
            }, common_1.HttpStatus.PAYMENT_REQUIRED);
        }
        return true;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], SubscriptionGuard);
//# sourceMappingURL=subscription.guard.js.map