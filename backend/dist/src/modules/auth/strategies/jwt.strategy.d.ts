import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    companyId?: string | null;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        name: string;
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
    }>;
}
export {};
