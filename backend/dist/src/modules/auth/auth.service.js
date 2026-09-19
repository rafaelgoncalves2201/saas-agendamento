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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const date_fns_1 = require("date-fns");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(email, pass) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    include: {
                        company: true,
                    },
                },
            },
        });
        if (!user || !user.isActive) {
            return null;
        }
        const isMatch = await argon2.verify(user.passwordHash, pass);
        if (!isMatch) {
            return null;
        }
        return user;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciais inválidas ou conta inativa');
        }
        let companyId = user.memberships[0]?.companyId || null;
        let company = user.memberships[0]?.company || null;
        if (!companyId && user.role === client_1.Role.SUPER_ADMIN) {
            const defaultCompany = await this.prisma.company.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: 'asc' },
            });
            if (defaultCompany) {
                companyId = defaultCompany.id;
                company = defaultCompany;
            }
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role, companyId);
        return {
            ...tokens,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId,
                company,
            },
        };
    }
    async registerCompany(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.ownerEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Já existe um usuário com este e-mail');
        }
        const cleanSlug = dto.companySlug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-');
        const existingCompany = await this.prisma.company.findUnique({
            where: { slug: cleanSlug },
        });
        if (existingCompany) {
            throw new common_1.ConflictException('Este identificador (slug) já está em uso por outra empresa');
        }
        const starterPlan = await this.prisma.plan.findUnique({
            where: { slug: 'starter' },
        });
        if (!starterPlan) {
            throw new common_1.BadRequestException('Plano inicial padrão não encontrado no sistema');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const passwordHash = await argon2.hash(dto.ownerPassword);
            const user = await tx.user.create({
                data: {
                    name: dto.ownerName,
                    email: dto.ownerEmail,
                    passwordHash,
                    phone: dto.companyPhone,
                    role: client_1.Role.COMPANY_ADMIN,
                },
            });
            const company = await tx.company.create({
                data: {
                    name: dto.companyName,
                    slug: cleanSlug,
                    phone: dto.companyPhone,
                    document: dto.companyDocument || null,
                    email: dto.ownerEmail,
                },
            });
            await tx.companyMember.create({
                data: {
                    companyId: company.id,
                    userId: user.id,
                    role: client_1.Role.COMPANY_ADMIN,
                },
            });
            await tx.subscription.create({
                data: {
                    companyId: company.id,
                    planId: starterPlan.id,
                    status: client_1.SubscriptionStatus.TRIALING,
                    amount: starterPlan.priceMonthly,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: (0, date_fns_1.addDays)(new Date(), 5),
                    trialEndsAt: (0, date_fns_1.addDays)(new Date(), 5),
                },
            });
            const standardDays = [1, 2, 3, 4, 5];
            for (const day of standardDays) {
                await tx.availability.create({
                    data: {
                        companyId: company.id,
                        dayOfWeek: day,
                        startTime: '08:00',
                        endTime: '18:00',
                        breakStart: '12:00',
                        breakEnd: '13:00',
                        isActive: true,
                    },
                });
            }
            const professionalSlug = dto.ownerName
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9-]/g, '-');
            await tx.professional.create({
                data: {
                    companyId: company.id,
                    userId: user.id,
                    name: dto.ownerName,
                    slug: professionalSlug,
                    phone: dto.companyPhone,
                    email: dto.ownerEmail,
                    bio: `Profissional em ${company.name}`,
                    isActive: true,
                },
            });
            return { user, company };
        });
        const tokens = await this.generateTokens(result.user.id, result.user.email, result.user.role, result.company.id);
        return {
            ...tokens,
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                companyId: result.company.id,
                company: result.company,
            },
        };
    }
    async refreshToken(dto) {
        let payload;
        try {
            payload = this.jwtService.verify(dto.refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'saas_super_secret_refresh_jwt_key_2026_q27z!',
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token expirado ou inválido');
        }
        const storedTokens = await this.prisma.refreshToken.findMany({
            where: {
                userId: payload.sub,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        let matchedTokenRecord = null;
        for (const record of storedTokens) {
            const match = await argon2.verify(record.tokenHash, dto.refreshToken);
            if (match) {
                matchedTokenRecord = record;
                break;
            }
        }
        if (!matchedTokenRecord) {
            throw new common_1.UnauthorizedException('Refresh token revogado ou não reconhecido');
        }
        await this.prisma.refreshToken.update({
            where: { id: matchedTokenRecord.id },
            data: { revokedAt: new Date() },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                memberships: {
                    include: {
                        company: true,
                    },
                },
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Usuário inativo ou inexistente');
        }
        const companyId = user.memberships[0]?.companyId || null;
        const newTokens = await this.generateTokens(user.id, user.email, user.role, companyId);
        return {
            ...newTokens,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId,
            },
        };
    }
    async logout(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return { message: 'Logout efetuado com sucesso' };
    }
    async generateTokens(userId, email, role, companyId) {
        const payload = { sub: userId, email, role, companyId };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET || 'saas_super_secret_access_jwt_key_2026_x89f!',
            expiresIn: 900,
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET || 'saas_super_secret_refresh_jwt_key_2026_q27z!',
            expiresIn: 604800,
        });
        const tokenHash = await argon2.hash(refreshToken);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: (0, date_fns_1.addDays)(new Date(), 7),
            },
        });
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 900,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map