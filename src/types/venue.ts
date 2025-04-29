// next/src/types/venue.ts

// Based on the VenueCard and API endpoints, define a comprehensive type
// This might need refinement as we implement more features
export interface Venue {
	id: string;
	name: string;
	description?: string; // Added optional description
	address: string; // Consider making this structured later (street, city, zip, etc.)
	latitude?: number;
	longitude?: number;
	phone?: string;
	website?: string;
	category?: string; // For filtering
	mainPhotoUrl?: string;
	photos?: { id: string; url: string }[]; // For gallery
	rating?: number;
	createdAt: string; // Assuming ISO string format from API
	updatedAt: string; // Assuming ISO string format from API
	// Add other fields as needed, e.g., opening hours, amenities, owner info
}

// Type for the search API response (assuming pagination)
export interface VenueSearchResult {
	venues: Venue[];
	total: number;
	page: number;
	limit: number;
}

// Type for search parameters
export interface VenueSearchParams {
	query?: string; // General search term (could search name, category, etc.)
	name?: string;
	location?: string; // Could be city, address fragment, etc.
	category?: string;
	page?: number;
	limit?: number;
	sortBy?: string; // e.g., 'rating', 'name', 'createdAt'
	sortOrder?: 'asc' | 'desc';
}

// --- Added Venue Settings & Staff Types ---

export interface BusinessHour {
	dayOfWeek: number; // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
	openTime: string; // HH:mm format
	closeTime: string; // HH:mm format
	isOpen: boolean;
}

export interface BookingSettings {
	enabled: boolean;
	requireApproval: boolean;
	allowCancellation: boolean;
	cancellationPolicy?: string; // Optional policy text
}

export interface LoyaltyProgramSettings {
	enabled: boolean;
	pointsPerVisit?: number; // Optional based on program type
	rewardThreshold?: number; // Optional based on program type
	rewardDescription?: string; // Optional based on program type
}

export interface AffiliateProgramSettings {
	enabled: boolean;
	commissionRate?: number; // Percentage, optional
	cookieDuration?: number; // Days, optional
}

export interface VenueSettings {
	// id: string; // Settings might not have their own ID, they belong to a venue
	businessHours: BusinessHour[];
	bookingSettings: BookingSettings;
	loyaltyProgram: LoyaltyProgramSettings;
	affiliateProgram: AffiliateProgramSettings;
	currency: string; // e.g., 'USD', 'EUR'
	timezone: string; // e.g., 'America/New_York', 'Europe/London'
	venueId: string;
	createdAt?: string; // Optional if not always returned
	updatedAt?: string; // Optional if not always returned
}

// Define as a const tuple for Zod enum compatibility
export const staffRoles = ['owner', 'manager', 'staff', 'hostess', 'waiter', 'bartender'] as const;
// Infer the union type from the tuple
export type StaffRole = typeof staffRoles[number];


export interface StaffMember {
	id: string; // This is the VenueStaff ID, not the User ID
	userId: string;
	venueId: string;
	email: string; // Assuming we get email for display
	name: string; // Assuming we get name for display
	role: StaffRole;
	// permissions?: string[]; // Add if permissions are more granular than roles
	joinedAt: string; // Assuming ISO string format
	// Add other relevant user details if needed (e.g., profile picture URL)
	user?: { // Embed user details if API provides them
		id: string;
		name: string;
		email: string;
		avatarUrl?: string;
	}
}

// DTOs for API requests

export interface AddStaffDto {
	email: string; // Backend finds user by email
	role: StaffRole;
}

export interface UpdateStaffDto {
	role?: StaffRole;
	// permissions?: string[]; // Add if API supports updating permissions directly
}

export interface UpdateVenueSettingsDto {
	businessHours?: BusinessHour[];
	bookingSettings?: Partial<BookingSettings>;
	loyaltyProgram?: Partial<LoyaltyProgramSettings>;
	affiliateProgram?: Partial<AffiliateProgramSettings>;
	currency?: string;
	timezone?: string;
}

export interface TransferOwnershipDto {
	newOwnerEmail: string; // Easier to identify user by email on frontend
}

// --- Venue Table Types ---

export const tableTypes = [
	'standard',
	'bar',
	'private',
	'outdoor',
	'lounge',
	'vip',
] as const;
export type TableType = (typeof tableTypes)[number];

export const tableStatuses = [
	'available',
	'occupied',
	'reserved',
	'out_of_service',
] as const;
export type TableStatus = (typeof tableStatuses)[number];

export interface VenueTable {
	id: string;
	venueId: string;
	name: string;
	capacity: number;
	type: TableType;
	location?: string; // e.g., 'Patio', 'Main Dining Room', 'Bar Area'
	status: TableStatus;
	minSpend?: number; // Optional minimum spend
	description?: string; // Optional description
	createdAt: string;
	updatedAt: string;
}

// DTOs for Table API requests
export interface CreateTableDto {
	name: string;
	capacity: number;
	type: TableType;
	location?: string;
	status: TableStatus; // Initial status
	minSpend?: number;
	description?: string;
}

export interface UpdateTableDto {
	name?: string;
	capacity?: number;
	type?: TableType;
	location?: string;
	status?: TableStatus;
	minSpend?: number;
	description?: string;
}

// Type for the Get Tables API response (assuming pagination or just an array)
export interface VenueTableListResponse {
	tables: VenueTable[];
	// Add pagination fields if the API supports them (e.g., total, page, limit)
}

// Type for Table search/filter parameters (if needed for client-side or API filtering)
export interface TableFilterParams {
	status?: TableStatus;
	location?: string;
	type?: TableType;
	// Add other potential filter fields
}
