import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Role, SubscriptionStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { addDays } from 'date-fns';
import { normalizePlanTier, PLAN_CONFIGS } from '../../common/config/plans.config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
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

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas ou conta inativa');
    }

    let companyId = user.memberships[0]?.companyId || null;
    let company = user.memberships[0]?.company || null;

    if (!companyId && user.role === Role.SUPER_ADMIN) {
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

  async registerCompany(dto: RegisterCompanyDto) {
    // 1. Validar se e-mail do proprietário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.ownerEmail },
    });
    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    // 2. Validar se slug da empresa já existe
    const cleanSlug = dto.companySlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-');

    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingCompany) {
      throw new ConflictException('Este identificador (slug) já está em uso por outra empresa');
    }

    // 3. Buscar plano escolhido (ou Básico por padrão)
    const selectedTier = normalizePlanTier(dto.plan || 'BASIC');
    const planConfig = PLAN_CONFIGS[selectedTier];

    let chosenPlan = await this.prisma.plan.findUnique({
      where: { slug: planConfig.slug },
    });

    if (!chosenPlan) {
      chosenPlan = await this.prisma.plan.findFirst({
        where: {
          OR: [
            { slug: planConfig.slug },
            { name: planConfig.name },
            { slug: 'basic' },
            { slug: 'starter' },
          ],
        },
      });
    }

    if (!chosenPlan) {
      throw new BadRequestException('Plano selecionado não encontrado no sistema');
    }

    // 4. Executar criação em transação segura
    const result = await this.prisma.$transaction(async (tx) => {
      const passwordHash = await argon2.hash(dto.ownerPassword);

      // Criar Usuário
      const user = await tx.user.create({
        data: {
          name: dto.ownerName,
          email: dto.ownerEmail,
          passwordHash,
          phone: dto.companyPhone,
          role: Role.COMPANY_ADMIN,
        },
      });

      // Criar Empresa
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          slug: cleanSlug,
          phone: dto.companyPhone,
          document: dto.companyDocument || null,
          email: dto.ownerEmail,
          settings: {
            primaryColor: '#E6D4B0',
            publicTheme: 'light',
            requiresDeposit: false,
            depositValue: 'R$ 0',
          },
        },
      });

      // Vincular Usuário à Empresa
      await tx.companyMember.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: Role.COMPANY_ADMIN,
        },
      });

      // Criar Assinatura Trial (5 dias de teste grátis no plano escolhido)
      await tx.subscription.create({
        data: {
          companyId: company.id,
          planId: chosenPlan.id,
          status: SubscriptionStatus.TRIALING,
          amount: chosenPlan.priceMonthly,
          currentPeriodStart: new Date(),
          currentPeriodEnd: addDays(new Date(), 5),
          trialEndsAt: addDays(new Date(), 5),
        },
      });

      // Criar horários de funcionamento padrão (Segunda a Sexta, 08h às 18h)
      const standardDays = [1, 2, 3, 4, 5]; // Seg a Sex
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

      // Criar profissional inicial (o próprio dono)
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

    const tokens = await this.generateTokens(
      result.user.id,
      result.user.email,
      result.user.role,
      result.company.id,
    );

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

  async refreshToken(dto: RefreshTokenDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'saas_super_secret_refresh_jwt_key_2026_q27z!',
      });
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou inválido');
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenRecord: any = null;
    for (const record of storedTokens) {
      const match = await argon2.verify(record.tokenHash, dto.refreshToken);
      if (match) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new UnauthorizedException('Refresh token revogado ou não reconhecido');
    }

    // Revoga o token atual (rotação de refresh token)
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
      throw new UnauthorizedException('Usuário inativo ou inexistente');
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

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logout efetuado com sucesso' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
    companyId: string | null,
  ) {
    const payload = { sub: userId, email, role, companyId };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'saas_super_secret_access_jwt_key_2026_x89f!',
      expiresIn: 900, // 15 minutos em segundos
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'saas_super_secret_refresh_jwt_key_2026_q27z!',
      expiresIn: 604800, // 7 dias em segundos
    });

    // Salva hash do refresh token no banco
    const tokenHash = await argon2.hash(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: addDays(new Date(), 7),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutos em segundos
    };
  }
}

