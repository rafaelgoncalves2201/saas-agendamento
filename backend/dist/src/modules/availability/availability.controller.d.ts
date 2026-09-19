import { AvailabilityService } from './availability.service';
import { CreateBlockedTimeDto, QuerySlotsDto, SetAvailabilityDto } from './dto/availability.dto';
import { PrismaService } from '../../database/prisma.service';
export declare class AvailabilityController {
    private readonly availabilityService;
    private readonly prisma;
    constructor(availabilityService: AvailabilityService, prisma: PrismaService);
    getAvailabilities(req: any, professionalId?: string): Promise<{
        id: string;
        isActive: boolean;
        companyId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        breakStart: string | null;
        breakEnd: string | null;
        professionalId: string | null;
    }[]>;
    setAvailabilities(req: any, dto: SetAvailabilityDto): Promise<{
        id: string;
        isActive: boolean;
        companyId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        breakStart: string | null;
        breakEnd: string | null;
        professionalId: string | null;
    }[]>;
    createBlockedTime(req: any, dto: CreateBlockedTimeDto): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        professionalId: string | null;
        startDateTime: Date;
        endDateTime: Date;
        reason: string | null;
    }>;
    listBlockedTimes(req: any, professionalId?: string): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        professionalId: string | null;
        startDateTime: Date;
        endDateTime: Date;
        reason: string | null;
    }[]>;
    deleteBlockedTime(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        professionalId: string | null;
        startDateTime: Date;
        endDateTime: Date;
        reason: string | null;
    }>;
    getPublicAvailableSlots(slug: string, query: QuerySlotsDto): Promise<{
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
