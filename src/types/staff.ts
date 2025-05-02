// next/src/types/staff.ts

// Based on internal/modules/venue/domain/venue_staff.go
export type StaffRole =
	| 'owner'
	| 'manager'
	| 'staff'
	| 'hostess'
	| 'waiter'
	| 'bartender'

export type StaffStatus = 'active' | 'inactive' | 'pending'

export type StaffPermission =
	| 'manage_venue'
	| 'manage_staff'
	| 'manage_settings'
	| 'manage_tables'
	| 'manage_events'
	| 'manage_products'
	| 'manage_reservation'
	| 'manage_orders'
	| 'manage_promotions'
	| 'view_reports'
	| 'view_settings'

export interface VenueStaff {
	id: string // uuid.UUID maps to string
	venue_id: string
	user_id: string
	// TODO: Fetch user details (like email/name) separately if needed for display
	// User User `json:"user"` - Assuming a User relation might exist or be needed
	email?: string // Added for convenience, assuming we can fetch/join it
	role: StaffRole
	permissions: StaffPermission[]
	status: StaffStatus
	created_at: string // time.Time maps to string (ISO 8601)
	updated_at: string
	deleted_at?: string | null // *time.Time maps to string | null
}

// Based on internal/modules/venue/port/venue_service.go
export interface AddStaffInput {
	venue_id: string
	user_id: string // This might need to be selected via a user search/dropdown
	role: StaffRole
	permissions?: StaffPermission[] // Optional in Go struct, keep optional? Check backend logic.
}

export interface UpdateStaffInput {
	role?: StaffRole
	permissions?: StaffPermission[]
	status?: StaffStatus
}

// For API responses that include pagination
export interface PaginatedVenueStaff {
	staff: VenueStaff[]
	total: number
	page: number
	limit: number
}
