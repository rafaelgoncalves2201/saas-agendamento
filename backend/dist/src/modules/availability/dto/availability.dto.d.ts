export declare class AvailabilityItemDto {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    isActive: boolean;
}
export declare class SetAvailabilityDto {
    professionalId?: string;
    availabilities: AvailabilityItemDto[];
}
export declare class CreateBlockedTimeDto {
    professionalId?: string;
    startDateTime: string;
    endDateTime: string;
    reason?: string;
}
export declare class QuerySlotsDto {
    professionalId: string;
    serviceId: string;
    date: string;
}
