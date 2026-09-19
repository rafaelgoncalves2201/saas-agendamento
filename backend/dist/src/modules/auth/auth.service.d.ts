import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<({
        memberships: ({
            company: {
                id: string;
                email: string;
                name: string;
                phone: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                document: string | null;
                logoUrl: string | null;
                coverUrl: string | null;
                settings: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            companyId: string;
            userId: string;
        })[];
    } & {
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            companyId: string | null;
            company: {
                id: string;
                email: string;
                name: string;
                phone: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                document: string | null;
                logoUrl: string | null;
                coverUrl: string | null;
                settings: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    registerCompany(dto: RegisterCompanyDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            companyId: string;
            company: {
                id: string;
                email: string;
                name: string;
                phone: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                document: string | null;
                logoUrl: string | null;
                coverUrl: string | null;
                settings: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            companyId: string | null;
        };
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    private generateTokens;
}
