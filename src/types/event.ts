// next/src/types/event.ts

export enum EventCategory {
	Music = "music",
	Sports = "sports",
	Arts = "arts",
	Food = "food",
	Business = "business",
	Conference = "conference",
	Other = "other",
}

export enum EventStatus {
	Draft = "draft",
	Published = "published",
	Cancelled = "cancelled",
	Completed = "completed",
}

export interface EventPhoto {
	id: string;
	url: string;
	altText?: string;
}

export interface RecurringSettings {
	frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
	interval: number | null; // e.g., every 2 weeks
	endDate: string | null; // ISO date string
	daysOfWeek?: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[]; // For weekly recurrence
	dayOfMonth?: number; // For monthly recurrence
}

export interface Event {
	id: string;
	venueId: string;
	name: string;
	description: string;
	startTime: string; // ISO date string
	endTime: string; // ISO date string
	capacity: number | null;
	ticketPrice: number | null;
	isFeatured: boolean;
	status: EventStatus;
	category: EventCategory;
	photos: EventPhoto[];
	recurringSettings?: RecurringSettings | null;
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string
}

export interface CreateEventDto extends Omit<Event, 'id' | 'venueId' | 'photos' | 'createdAt' | 'updatedAt'> {
	venueId: string;
	// Photos will be uploaded separately
}

export type UpdateEventDto = Partial<Omit<CreateEventDto, 'venueId'>>;

export interface AddEventPhotoDto {
	file: File; // Assuming file upload handling
	altText?: string;
}
