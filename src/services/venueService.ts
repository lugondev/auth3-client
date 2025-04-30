// next/src/services/venueService.ts
import apiClient from '@/lib/apiClient';
import { // Removed duplicate/incorrect Table type imports from venue.ts
	Venue, VenueSearchResult, VenueSearchParams,
	VenueSettings, UpdateVenueSettingsDto,
	StaffMember, AddStaffDto, UpdateStaffDto, TransferOwnershipDto,
	// Venue DTOs
	CreateVenueData, UpdateVenueData,
} from '@/types/venue';
import { Table, CreateTableDTO, UpdateTableDTO, PaginatedTableResponse } from '@/types/table'; // Keep table types import
import {
	// Product Types
	Product, CreateProductDTO, UpdateProductDTO, ProductPhoto, PaginatedProductResponse,
} from '@/types/product'; // Corrected PaginatedProductResponse already present
import {
	// Event Types
	Event, CreateEventDto, UpdateEventDto, EventPhoto, AddEventPhotoDto,
} from '@/types/event';


// Remove local definitions - rely on imported types from types/venue.ts
// type CreateVenueData = ...; // REMOVED
// type UpdateVenueData = ...; // REMOVED

const venueService = {
	/**
	 * Search for venues based on specified criteria.
	 * GET /api/v1/venues/search
	 */
	async searchVenues(params: VenueSearchParams): Promise<VenueSearchResult> {
		try {
			// apiClient expects query params as the second argument for GET
			const response = await apiClient.get<VenueSearchResult>('/api/v1/venues/search', { params }); // Added /api/v1
			// Ensure the response matches the expected structure, provide defaults if needed
			return response.data || { venues: [], total: 0, page: 1, limit: params.limit || 10 };
		} catch (error) {
			console.error('Error searching venues:', error);
			// Re-throw or return a default error structure
			throw error;
			// Or return { venues: [], total: 0, page: 1, limit: params.limit || 10 }; // Depending on error handling strategy
		}
	},

	/**
	 * Get details for a specific venue by its ID.
	 * GET /api/v1/venues/{id}
	 */
	async getVenueById(id: string): Promise<Venue> {
		if (!id) throw new Error('Venue ID is required');
		try {
			const response = await apiClient.get<Venue>(`/api/v1/venues/${id}`); // Added /api/v1
			if (!response.data) {
				throw new Error(`Venue with ID ${id} not found.`);
			}
			return response.data;
		} catch (error) {
			console.error(`Error fetching venue ${id}:`, error);
			throw error;
		}
	},

	/**
	 * Create a new venue.
	 * POST /api/v1/venues
	 */
	async createVenue(data: CreateVenueData): Promise<Venue> {
		try {
			// apiClient expects data as the second argument for POST
			const response = await apiClient.post<Venue>('/api/v1/venues', data); // Added /api/v1
			return response.data;
		} catch (error) {
			console.error('Error creating venue:', error);
			throw error;
		}
	},

	/**
	 * Update details for an existing venue.
	 * PATCH /api/v1/venues/{id}
	 */
	async updateVenue(id: string, data: UpdateVenueData): Promise<Venue> {
		if (!id) throw new Error('Venue ID is required for update');
		try {
			// apiClient expects data as the second argument for PATCH
			const response = await apiClient.patch<Venue>(`/api/v1/venues/${id}`, data); // Added /api/v1
			return response.data;
		} catch (error) {
			console.error(`Error updating venue ${id}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a venue by its ID.
	 * DELETE /api/v1/venues/{id}
	 */
	async deleteVenue(id: string): Promise<void> {
		if (!id) throw new Error('Venue ID is required for deletion');
		try {
			await apiClient.delete(`/api/v1/venues/${id}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error deleting venue ${id}:`, error);
			throw error;
		}
	},

	/**
	 * Upload a photo for a venue.
	 * POST /api/v1/venues/{id}/photos
	 * Note: File uploads often require specific handling (FormData).
	 * apiClient might need adjustment or specific configuration for this.
	 */
	async uploadVenuePhoto(venueId: string, file: File): Promise<{ id: string; url: string }> {
		if (!venueId) throw new Error('Venue ID is required for photo upload');
		if (!file) throw new Error('File is required for photo upload');

		const formData = new FormData();
		formData.append('file', file); // Key 'file' might need to match backend expectation

		try {
			// Adjust apiClient call if needed for FormData and content-type header
			const response = await apiClient.post<{ id: string; url: string }>(
				`/api/v1/venues/${venueId}/photos`, // Added /api/v1
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);
			return response.data;
		} catch (error) {
			console.error(`Error uploading photo for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a specific photo for a venue.
	 * DELETE /api/v1/venues/{id}/photos/{photoId}
	 */
	async deleteVenuePhoto(venueId: string, photoId: string): Promise<void> {
		if (!venueId || !photoId) throw new Error('Venue ID and Photo ID are required for deletion');
		try {
			await apiClient.delete(`/api/v1/venues/${venueId}/photos/${photoId}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error deleting photo ${photoId} for venue ${venueId}:`, error);
			throw error;
		}
	},

	// --- Venue Settings ---

	/**
	 * Get settings for a specific venue.
	 * GET /api/v1/venues/{id}/settings
	 */
	async getVenueSettings(venueId: string): Promise<VenueSettings> {
		if (!venueId) throw new Error('Venue ID is required to get settings');
		try {
			const response = await apiClient.get<VenueSettings>(`/api/v1/venues/${venueId}/settings`); // Added /api/v1
			if (!response.data) {
				throw new Error(`Settings not found for venue ID ${venueId}.`);
			}
			return response.data;
		} catch (error) {
			console.error(`Error fetching settings for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Update settings for a specific venue.
	 * PATCH /api/v1/venues/{id}/settings
	 */
	async updateVenueSettings(venueId: string, data: UpdateVenueSettingsDto): Promise<VenueSettings> {
		if (!venueId) throw new Error('Venue ID is required to update settings');
		try {
			const response = await apiClient.patch<VenueSettings>(`/api/v1/venues/${venueId}/settings`, data); // Added /api/v1
			return response.data; // Assuming API returns the updated settings
		} catch (error) {
			console.error(`Error updating settings for venue ${venueId}:`, error);
			throw error;
		}
	},

	// --- Venue Staff ---

	/**
	 * Get staff list for a specific venue.
	 * GET /api/v1/venues/{id}/staff
	 */
	async getVenueStaff(venueId: string): Promise<StaffMember[]> {
		if (!venueId) throw new Error('Venue ID is required to get staff');
		try {
			const response = await apiClient.get<StaffMember[]>(`/api/v1/venues/${venueId}/staff`); // Added /api/v1
			return response.data || []; // Return empty array if no staff or data is null/undefined
		} catch (error) {
			console.error(`Error fetching staff for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Add a new staff member to a venue.
	 * POST /api/v1/venues/{id}/staff
	 */
	async addStaffMember(venueId: string, data: AddStaffDto): Promise<StaffMember> {
		if (!venueId) throw new Error('Venue ID is required to add staff');
		try {
			const response = await apiClient.post<StaffMember>(`/api/v1/venues/${venueId}/staff`, data); // Added /api/v1
			return response.data; // Assuming API returns the newly added staff member details
		} catch (error) {
			console.error(`Error adding staff to venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Update details (e.g., role) for a specific staff member.
	 * PATCH /api/v1/venues/{id}/staff/{staffId}
	 */
	async updateStaffMember(venueId: string, staffId: string, data: UpdateStaffDto): Promise<StaffMember> {
		if (!venueId || !staffId) throw new Error('Venue ID and Staff ID are required to update staff');
		try {
			const response = await apiClient.patch<StaffMember>(`/api/v1/venues/${venueId}/staff/${staffId}`, data); // Added /api/v1
			return response.data; // Assuming API returns the updated staff member details
		} catch (error) {
			console.error(`Error updating staff ${staffId} for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Remove a staff member from a venue.
	 * DELETE /api/v1/venues/{id}/staff/{staffId}
	 */
	async removeStaffMember(venueId: string, staffId: string): Promise<void> {
		if (!venueId || !staffId) throw new Error('Venue ID and Staff ID are required to remove staff');
		try {
			await apiClient.delete(`/api/v1/venues/${venueId}/staff/${staffId}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error removing staff ${staffId} from venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Transfer ownership of a venue to another user.
	 * POST /api/v1/venues/{id}/transfer-ownership
	 */
	async transferVenueOwnership(venueId: string, data: TransferOwnershipDto): Promise<void> {
		if (!venueId) throw new Error('Venue ID is required to transfer ownership');
		try {
			// Assuming the API returns 204 No Content or similar on success
			await apiClient.post(`/api/v1/venues/${venueId}/transfer-ownership`, data); // Added /api/v1
		} catch (error) {
			console.error(`Error transferring ownership for venue ${venueId}:`, error);
			throw error;
		}
	},

	// --- Venue Tables ---

	/**
	 * Get all tables for a specific venue.
	 * GET /api/v1/venues/{id}/tables?page={page}&limit={limit}&groupID={groupID}
	 */
	async getVenueTables(
		venueId: string,
		page: number = 1,
		limit: number = 10,
		groupId?: string | null // Optional group ID filter
	): Promise<PaginatedTableResponse> {
		if (!venueId) throw new Error('Venue ID is required to get tables');
		const params: Record<string, string | number | boolean | undefined> = { page, limit }; // Explicitly type params
		if (groupId) {
			params.groupID = groupId; // Match backend query param name
		}
		try {
			const response = await apiClient.get<PaginatedTableResponse>(`/api/v1/venues/${venueId}/tables`, { params }); // Added /api/v1
			// Return the full paginated response structure
			return response.data || { tables: [], total: 0, page: 1, limit: 10 };
		} catch (error) {
			console.error(`Error fetching tables for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Create a new table for a specific venue.
	 * POST /api/v1/venues/{id}/tables
	 */
	async createTable(venueId: string, data: CreateTableDTO): Promise<Table> { // Use imported CreateTableDTO
		if (!venueId) throw new Error('Venue ID is required to create a table');
		try {
			const response = await apiClient.post<Table>(`/api/v1/venues/${venueId}/tables`, data); // Added /api/v1
			return response.data; // Assuming API returns the newly created table details
		} catch (error) {
			console.error(`Error creating table for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Get details for a specific table by its ID.
	 * GET /api/v1/tables/{id}
	 * Note: Endpoint uses /tables/{id}, not nested under venue
	 */
	async getTableDetails(tableId: string): Promise<Table> { // Updated return type
		if (!tableId) throw new Error('Table ID is required to get details');
		try {
			const response = await apiClient.get<Table>(`/api/v1/tables/${tableId}`); // Added /api/v1
			if (!response.data) {
				throw new Error(`Table with ID ${tableId} not found.`);
			}
			return response.data;
		} catch (error) {
			console.error(`Error fetching table details for ${tableId}:`, error);
			throw error;
		}
	},

	/**
	 * Update details for an existing table.
	 * PATCH /api/v1/tables/{id}
	 * Note: Endpoint uses /tables/{id}, not nested under venue
	 */
	async updateTable(tableId: string, data: UpdateTableDTO): Promise<Table> { // Use imported UpdateTableDTO
		if (!tableId) throw new Error('Table ID is required for update');
		try {
			const response = await apiClient.patch<Table>(`/api/v1/tables/${tableId}`, data); // Added /api/v1
			return response.data; // Assuming API returns the updated table details
		} catch (error) {
			console.error(`Error updating table ${tableId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a table by its ID.
	 * DELETE /api/v1/tables/{id}
	 * Note: Endpoint uses /tables/{id}, not nested under venue
	 */
	async deleteTable(tableId: string): Promise<void> {
		if (!tableId) throw new Error('Table ID is required for deletion');
		try {
			await apiClient.delete(`/api/v1/tables/${tableId}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error deleting table ${tableId}:`, error);
			throw error;
		}
	},

	// --- Venue Products ---

	/**
	 * Get all products for a specific venue.
	 * GET /api/v1/venues/{id}/products?page={page}&limit={limit}&category={category}&featured={featured}
	 */
	async getVenueProducts(
		venueId: string,
		page: number = 1,
		limit: number = 10,
		filters?: { category?: string; featured?: boolean } // Add filters
	): Promise<PaginatedProductResponse> {
		if (!venueId) throw new Error('Venue ID is required to get products');
		const params: Record<string, string | number | boolean | undefined> = { page, limit, ...filters }; // Explicitly type params
		// Ensure boolean 'featured' filter is string 'true' or 'false' if sent
		if (params.featured !== undefined) {
			params.featured = String(params.featured); // Convert boolean to string for query param
		}

		try {
			const response = await apiClient.get<PaginatedProductResponse>(`/api/v1/venues/${venueId}/products`, { params }); // Added /api/v1
			// Return the full paginated response structure
			return response.data || { products: [], total: 0, page: 1, limit: 10 };
		} catch (error) {
			console.error(`Error fetching products for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Create a new product for a specific venue.
	 * POST /api/v1/venues/{id}/products
	 */
	async createProduct(venueId: string, data: CreateProductDTO): Promise<Product> {
		if (!venueId) throw new Error('Venue ID is required to create a product');
		try {
			const response = await apiClient.post<Product>(`/api/v1/venues/${venueId}/products`, data); // Added /api/v1
			return response.data; // Assuming API returns the newly created product details
		} catch (error) {
			console.error(`Error creating product for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Get details for a specific product by its ID.
	 * GET /api/v1/products/{id}
	 * Note: Endpoint uses /products/{id}, not nested under venue
	 */
	async getProductDetails(productId: string): Promise<Product> {
		if (!productId) throw new Error('Product ID is required to get details');
		try {
			const response = await apiClient.get<Product>(`/api/v1/products/${productId}`); // Added /api/v1
			if (!response.data) {
				throw new Error(`Product with ID ${productId} not found.`);
			}
			return response.data;
		} catch (error) {
			console.error(`Error fetching product details for ${productId}:`, error);
			throw error;
		}
	},

	/**
	 * Update details for an existing product.
	 * PATCH /api/v1/products/{id}
	 * Note: Endpoint uses /products/{id}, not nested under venue
	 */
	async updateProduct(productId: string, data: UpdateProductDTO): Promise<Product> {
		if (!productId) throw new Error('Product ID is required for update');
		try {
			const response = await apiClient.patch<Product>(`/api/v1/products/${productId}`, data); // Added /api/v1
			return response.data; // Assuming API returns the updated product details
		} catch (error) {
			console.error(`Error updating product ${productId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a product by its ID.
	 * DELETE /api/v1/products/{id}
	 * Note: Endpoint uses /products/{id}, not nested under venue
	 */
	async deleteProduct(productId: string): Promise<void> {
		if (!productId) throw new Error('Product ID is required for deletion');
		try {
			await apiClient.delete(`/api/v1/products/${productId}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error deleting product ${productId}:`, error);
			throw error;
		}
	},

	/**
	 * Upload a photo for a specific product.
	 * POST /api/v1/products/{id}/photos
	 * Note: Endpoint uses /products/{id}, not nested under venue
	 */
	async uploadProductPhoto(
		productId: string,
		file: File,
		caption?: string,
		isPrimary?: boolean
	): Promise<ProductPhoto> {
		if (!productId) throw new Error('Product ID is required for photo upload');
		if (!file) throw new Error('File is required for photo upload');

		const formData = new FormData();
		formData.append('photo', file); // Key 'photo' matches backend handler
		if (caption) {
			formData.append('caption', caption); // Add caption if provided
		}
		if (isPrimary !== undefined) {
			formData.append('isPrimary', String(isPrimary)); // Add isPrimary if provided (as string 'true'/'false')
		}

		try {
			// Assuming API returns the newly added ProductPhoto object
			const response = await apiClient.post<ProductPhoto>(
				`/api/v1/products/${productId}/photos`, // Added /api/v1
				formData,
				{ headers: { 'Content-Type': 'multipart/form-data' } }
			);
			return response.data;
		} catch (error: unknown) { // Use unknown type for error
			// Improve error logging
			let errorMessage = `Error uploading photo for product ${productId}`;
			if (error instanceof Error) {
				errorMessage += `: ${error.message}`;
				// Check if it's an Axios error to potentially get more details
				if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
					console.error("Server Response Data:", error.response.data);
					errorMessage += ` - Server response: ${JSON.stringify(error.response.data)}`;
				}
			} else {
				errorMessage += `: An unknown error occurred.`;
				console.error(errorMessage, error); // Log the raw error object
			}
			console.error(errorMessage); // Log the combined message
			throw new Error(errorMessage); // Re-throw with a more informative message
		}
	},

	/**
	 * Delete a specific photo for a product.
	 * DELETE /api/v1/products/{id}/photos/{photoId}
	 * Note: Endpoint uses /products/{id}, not nested under venue
	 */
	async deleteProductPhoto(productId: string, photoId: string): Promise<void> {
		if (!productId || !photoId) throw new Error('Product ID and Photo ID are required for deletion');
		try {
			await apiClient.delete(`/api/v1/products/${productId}/photos/${photoId}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error deleting photo ${photoId} for product ${productId}:`, error);
			throw error;
		}
	},

	// --- Venue Events ---

	/**
	 * Get all events for a specific venue.
	 * GET /api/v1/venues/{id}/events
	 */
	async getVenueEvents(venueId: string): Promise<Event[]> {
		if (!venueId) throw new Error('Venue ID is required to get events');
		try {
			const response = await apiClient.get<Event[]>(`/api/v1/venues/${venueId}/events`); // Added /api/v1
			return response.data || []; // Return empty array if no events
		} catch (error) {
			console.error(`Error fetching events for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Get upcoming events for a specific venue.
	 * GET /api/v1/venues/{id}/events/upcoming
	 */
	async getUpcomingVenueEvents(venueId: string): Promise<Event[]> {
		if (!venueId) throw new Error('Venue ID is required to get upcoming events');
		try {
			const response = await apiClient.get<Event[]>(`/api/v1/venues/${venueId}/events/upcoming`); // Added /api/v1
			return response.data || []; // Return empty array if no events
		} catch (error) {
			console.error(`Error fetching upcoming events for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Create a new event for a specific venue.
	 * POST /api/v1/venues/{id}/events
	 */
	async createEvent(venueId: string, data: CreateEventDto): Promise<Event> {
		if (!venueId) throw new Error('Venue ID is required to create an event');
		try {
			const response = await apiClient.post<Event>(`/api/v1/venues/${venueId}/events`, data); // Added /api/v1
			return response.data; // Assuming API returns the newly created event details
		} catch (error) {
			console.error(`Error creating event for venue ${venueId}:`, error);
			throw error;
		}
	},

	/**
	 * Get details for a specific event by its ID.
	 * GET /api/v1/events/{id}
	 * Note: Endpoint uses /events/{id}, not nested under venue
	 */
	async getEventDetails(eventId: string): Promise<Event> {
		if (!eventId) throw new Error('Event ID is required to get details');
		try {
			const response = await apiClient.get<Event>(`/api/v1/events/${eventId}`); // Added /api/v1
			if (!response.data) {
				throw new Error(`Event with ID ${eventId} not found.`);
			}
			return response.data;
		} catch (error) {
			console.error(`Error fetching event details for ${eventId}:`, error);
			throw error;
		}
	},

	/**
	 * Update details for an existing event.
	 * PATCH /api/v1/events/{id}
	 * Note: Endpoint uses /events/{id}, not nested under venue
	 */
	async updateEvent(eventId: string, data: UpdateEventDto): Promise<Event> {
		if (!eventId) throw new Error('Event ID is required for update');
		try {
			const response = await apiClient.patch<Event>(`/api/v1/events/${eventId}`, data); // Added /api/v1
			return response.data; // Assuming API returns the updated event details
		} catch (error) {
			console.error(`Error updating event ${eventId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete an event by its ID.
	 * DELETE /api/v1/events/{id}
	 * Note: Endpoint uses /events/{id}, not nested under venue
	 */
	async deleteEvent(eventId: string): Promise<void> {
		if (!eventId) throw new Error('Event ID is required for deletion');
		try {
			await apiClient.delete(`/api/v1/events/${eventId}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error deleting event ${eventId}:`, error);
			throw error;
		}
	},

	/**
	 * Upload a photo for a specific event.
	 * POST /api/v1/events/{id}/photos
	 * Note: Endpoint uses /events/{id}, not nested under venue
	 */
	async addEventPhoto(eventId: string, data: AddEventPhotoDto): Promise<EventPhoto> {
		if (!eventId) throw new Error('Event ID is required for photo upload');
		if (!data.file) throw new Error('File is required for photo upload');

		const formData = new FormData();
		formData.append('file', data.file);
		if (data.altText) {
			formData.append('altText', data.altText); // Optional alt text
		}

		try {
			// Assuming API returns the newly added EventPhoto object
			const response = await apiClient.post<EventPhoto>(
				`/api/v1/events/${eventId}/photos`, // Added /api/v1
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);
			return response.data;
		} catch (error) {
			console.error(`Error uploading photo for event ${eventId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a specific photo for an event.
	 * DELETE /api/v1/events/{id}/photos/{photoId}
	 * Note: Endpoint uses /events/{id}, not nested under venue
	 */
	async deleteEventPhoto(eventId: string, photoId: string): Promise<void> {
		if (!eventId || !photoId) throw new Error('Event ID and Photo ID are required for deletion');
		try {
			await apiClient.delete(`/api/v1/events/${eventId}/photos/${photoId}`); // Added /api/v1
			// No content expected on successful delete
		} catch (error) {
			console.error(`Error deleting photo ${photoId} for event ${eventId}:`, error);
			throw error;
		}
	},

}; // End of venueService object

export default venueService;
