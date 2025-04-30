// next/src/types/table.ts

/**
 * Represents the possible statuses of a table.
 */
export enum TableStatus {
	AVAILABLE = 'available',
	OCCUPIED = 'occupied',
	RESERVED = 'reserved',
	DISABLED = 'disabled', // Added possibility
}

/**
 * Represents a table within a venue.
 */
export interface Table {
	id: string; // UUID
	venueId: string; // UUID of the venue it belongs to
	groupId?: string | null; // Optional UUID of the group/zone it belongs to
	name: string; // e.g., "T1", "Window Booth 2"
	capacity: number; // Maximum number of guests
	status: TableStatus;
	// Add any other relevant fields based on venueDomain.Table if known
	// e.g., positionX?: number;
	// e.g., positionY?: number;
	// e.g., shape?: 'rectangle' | 'circle';
	createdAt: string; // ISO 8601 date string
	updatedAt: string; // ISO 8601 date string
}

/**
 * Data Transfer Object for creating a new table.
 * Omits system-generated fields like id, createdAt, updatedAt.
 * venueId will be added by the handler or service layer.
 */
export type CreateTableDTO = Omit<Table, 'id' | 'venueId' | 'createdAt' | 'updatedAt'>;

/**
 * Data Transfer Object for updating an existing table.
 * All fields are optional.
 * Omits system-generated fields and venueId (usually not updatable).
 */
export type UpdateTableDTO = Partial<Omit<Table, 'id' | 'venueId' | 'createdAt' | 'updatedAt'>>;

/**
 * Response structure for fetching multiple tables with pagination.
 */
export interface PaginatedTableResponse {
	tables: Table[];
	total: number;
	page: number;
	limit: number;
}
