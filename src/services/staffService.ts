import apiClient from '@/lib/apiClient';
import { VenueStaff, AddStaffInput, UpdateStaffInput, PaginatedVenueStaff } from '@/types/staff';

const STAFF_API_BASE = (venueId: string) => `/venues/${venueId}/staff`;

/**
 * Fetch staff members for a specific venue with pagination.
 * Corresponds to GET /api/v1/venues/{id}/staff
 */
export const getVenueStaff = async (
	venueId: string,
	page: number = 1,
	limit: number = 10
): Promise<PaginatedVenueStaff> => {
	try {
		const response = await apiClient.get<PaginatedVenueStaff>(STAFF_API_BASE(venueId), {
			params: { page, limit },
		});
		// The backend currently returns { staff: [], total: number, page: number, limit: number }
		// Ensure this matches PaginatedVenueStaff structure
		return response.data;
	} catch (error) {
		console.error('Error fetching venue staff:', error);
		// Re-throw or handle error as needed for UI feedback
		throw error;
	}
};

/**
 * Add a new staff member to a venue.
 * Corresponds to POST /api/v1/venues/{id}/staff
 * IMPORTANT: The AddStaffInput requires user_id. This function assumes user_id is provided.
 * The UI component needs to handle resolving email to user_id before calling this.
 */
export const addVenueStaff = async (
	venueId: string,
	staffData: AddStaffInput
): Promise<VenueStaff> => {
	if (!staffData.user_id || staffData.user_id === 'placeholder-user-id') {
		// Prevent API call if user_id is missing or placeholder
		throw new Error("Valid user_id is required to add staff.");
	}
	try {
		const response = await apiClient.post<VenueStaff>(STAFF_API_BASE(venueId), staffData);
		return response.data;
	} catch (error) {
		console.error('Error adding venue staff:', error);
		throw error;
	}
};

/**
 * Update an existing staff member's details.
 * Corresponds to PATCH /api/v1/venues/{id}/staff/{staffId}
 */
export const updateVenueStaff = async (
	venueId: string,
	staffId: string,
	updateData: UpdateStaffInput
): Promise<VenueStaff> => {
	try {
		const response = await apiClient.patch<VenueStaff>(`${STAFF_API_BASE(venueId)}/${staffId}`, updateData);
		return response.data;
	} catch (error) {
		console.error('Error updating venue staff:', error);
		throw error;
	}
};

/**
 * Delete a staff member from a venue.
 * Corresponds to DELETE /api/v1/venues/{id}/staff/{staffId}
 */
export const deleteVenueStaff = async (
	venueId: string,
	staffId: string
): Promise<void> => {
	try {
		await apiClient.delete(`${STAFF_API_BASE(venueId)}/${staffId}`);
	} catch (error) {
		console.error('Error deleting venue staff:', error);
		throw error;
	}
};

// Optional: Add a function to search users by email if needed for the 'Add Staff' flow
// export const searchUsersByEmail = async (email: string): Promise<User[]> => { ... }
