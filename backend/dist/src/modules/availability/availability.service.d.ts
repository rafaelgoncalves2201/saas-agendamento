import { PrismaService } from '../../database/prisma.service';
import { CreateBlockedTimeDto, QuerySlotsDto, SetAvailabilityDto } from './dto/availability.dto';
export declare class AvailabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    getAvailabilities(companyId: string, professionalId?: string): Promise<{
        id: string;
        isActive: boolean;
        companyId: string;
        professionalId: string | null;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        breakStart: string | null;
        breakEnd: string | null;
    }[]>;
    setAvailabilities(companyId: string, dto: SetAvailabilityDto): Promise<{
        id: string;
        isActive: boolean;
        companyId: string;
        professionalId: string | null;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        breakStart: string | null;
        breakEnd: string | null;
    }[]>;
    createBlockedTime(companyId: string, dto: CreateBlockedTimeDto): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        professionalId: string | null;
        startDateTime: Date;
        endDateTime: Date;
        reason: string | null;
    }>;
    listBlockedTimes(companyId: string, professionalId?: string): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        professionalId: string | null;
        startDateTime: Date;
        endDateTime: Date;
        reason: string | null;
    }[]>;
    deleteBlockedTime(companyId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        professionalId: string | null;
        startDateTime: Date;
        endDateTime: Date;
        reason: string | null;
    }>;
    calculateAvailableSlots(companyId: string, query: QuerySlotsDto): Promise<{
        date: string;
        dayOfWeek: number;
        availableSlots: never[];
        message: string;
        service?: undefined;
        professional?: undefined;
        timezone?: undefined;
    } | {
        date: string;
        service: {
            id: string;
            name: string;
            durationMinutes: number;
            price: import("@prisma/client/runtime/library").Decimal;
        };
        professional: {
            id: string;
            name: string;
        };
        timezone: any;
        availableSlots: {
            time: string;
            endTime: string;
            label: string;
            duration: number;
            start: string;
            end: string;
        }[];
        dayOfWeek?: undefined;
        message?: undefined;
    }>;
}
