import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Rotas públicas não possuem usuário no request
    if (!user) {
      return next.handle();
    }

    // Super Admin tem visão global e flexibilidade de empresa
    if (user.role === Role.SUPER_ADMIN) {
      const explicitCompanyId = request.headers['x-tenant-id'];
      if (explicitCompanyId) {
        request.companyId = explicitCompanyId;
        return next.handle();
      }

      return from(
        this.prisma.company.findFirst({
          where: {
            OR: [
              ...(user.companyId ? [{ id: user.companyId, isActive: true }] : []),
              { isActive: true },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        }),
      ).pipe(
        mergeMap((activeCompany) => {
          if (activeCompany) {
            request.companyId = activeCompany.id;
          }
          return next.handle();
        }),
      );
    }

    // Usuários normais (COMPANY_ADMIN, PROFESSIONAL, STAFF) DEVEM ter um companyId vinculado
    if (!user.companyId) {
      throw new UnauthorizedException('Empresa não vinculada à sessão do usuário');
    }

    request.companyId = user.companyId;
    return next.handle();
  }
}
