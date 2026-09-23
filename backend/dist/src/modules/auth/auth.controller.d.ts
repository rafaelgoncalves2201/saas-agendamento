import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            companyId: string | null;
            company: {
                id: string;
                name: string;
                slug: string;
                document: string | null;
                email: string;
                phone: string;
                logoUrl: string | null;
                coverUrl: string | null;
                settings: import("@prisma/client/runtime/library").JsonValue;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                mpAccessToken: string | null;
                mpRefreshToken: string | null;
                mpUserId: string | null;
                mpExpiresIn: number | null;
                mpTokenType: string | null;
                mpPublicKey: string | null;
            };
        };
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    registerCompany(registerDto: RegisterCompanyDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            companyId: string;
            company: {
                id: string;
                name: string;
                slug: string;
                document: string | null;
                email: string;
                phone: string;
                logoUrl: string | null;
                coverUrl: string | null;
                settings: import("@prisma/client/runtime/library").JsonValue;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                mpAccessToken: string | null;
                mpRefreshToken: string | null;
                mpUserId: string | null;
                mpExpiresIn: number | null;
                mpTokenType: string | null;
                mpPublicKey: string | null;
            };
        };
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    refreshToken(refreshDto: RefreshTokenDto): Promise<{
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
    getProfile(user: any): any;
}
