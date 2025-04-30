// next/src/types/slot.ts

export const slotTypes = ['table', 'seat'] as const;
export type SlotType = typeof slotTypes[number];

export const slotShapes = ['rect', 'circle', 'ellipse', 'longrect'] as const;
export type SlotShape = typeof slotShapes[number];

// Note: The API spec uses 'available', 'selected', 'reserved', 'confirmed'.
// Ensure these align with any potential TableStatus if they represent similar concepts,
// or keep them distinct if they serve different purposes (e.g., Slot editing vs. Table booking status).
export const slotStatuses = ['available', 'selected', 'reserved', 'confirmed'] as const;
export type SlotStatus = typeof slotStatuses[number];

export interface Slot {
	id: string; // Assuming the API returns an ID for PATCH/DELETE
	venueId: string; // Assuming this is available or needed
	label: string;
	type: SlotType;
	shape: SlotShape;
	status: SlotStatus;
	width: number;
	height: number;
	x: number;
	y: number;
	rotation: number;
	zone: string;
	metadata?: number[] | null; // Type refined based on example [1, 2, 3]
	createdAt?: string; // Optional, if provided by API
	updatedAt?: string; // Optional, if provided by API
}

// --- DTOs for API Requests ---

export interface CreateSlotDto {
	label: string;
	type: SlotType;
	shape: SlotShape;
	status?: SlotStatus; // Optional on creation, backend might default
	width: number;
	height: number;
	x: number;
	y: number;
	rotation?: number; // Optional, backend might default to 0
	zone: string;
	metadata?: number[] | null; // Optional
}

// All fields are optional for partial updates
export interface UpdateSlotDto {
	label?: string;
	type?: SlotType;
	shape?: SlotShape;
	status?: SlotStatus;
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	rotation?: number;
	zone?: string;
	metadata?: number[] | null; // Optional
}

// --- API Response Type ---

// Assuming it might return an array directly or a structured response
export interface SlotListResponse {
	slots: Slot[];
	// Add pagination fields like total, page, limit if the API supports them
	total?: number;
	page?: number;
	limit?: number;
}
