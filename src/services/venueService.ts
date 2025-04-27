import apiClient, {
	Venue,
	CreateVenueInput,
	UpdateVenueInput,
	PaginatedVenues,
	VenueSearchQuery,
	VenuePhoto,
	VenueStaff,
	AddVenueStaffInput,
	UpdateVenueStaffInput,
	PaginatedVenueStaff,
	VenueStaffSearchQuery,
	VenueSettings,
	UpdateVenueSettingsInput,
	TransferVenueOwnershipInput,
	// Event types
	Event,
	CreateEventInput,
	UpdateEventInput,
	PaginatedEvents,
	EventSearchQuery,
	EventPhoto,
	// Product types
	Product,
	CreateProductInput,
	UpdateProductInput,
	PaginatedProducts,
	ProductSearchQuery,
	ProductPhoto,
	ProductOption,
	OptionChoice, // Assuming needed for product options manipulation
	// Table types
	Table,
	CreateTableInput,
	UpdateTableInput,
	PaginatedTables,
	TableSearchQuery,
	// Add specific DTOs for nested operations if needed
} from '@/lib/apiClient';

// --- Venue Operations ---

/**
 * Creates a new venue.
 * Corresponds to POST /venues
 * @param data The venue creation data (CreateVenueInput).
 * @returns The created Venue data.
 */
export const createVenue = async (data: CreateVenueInput): Promise<Venue> => {
	try {
		const response = await apiClient.post<Venue>('/venues', data);
		return response.data;
	} catch (error) {
		console.error('Error creating venue:', error);
		throw error;
	}
};

/**
 * Fetches a venue by its ID.
 * Corresponds to GET /venues/{venueId}
 * @param venueId The ID of the venue to fetch.
 * @returns The Venue data.
 */
export const getVenueById = async (venueId: string): Promise<Venue> => {
	try {
		const response = await apiClient.get<Venue>(`/venues/${venueId}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Searches for venues based on specified criteria.
 * Corresponds to GET /venues or GET /venues/search (assuming /venues with query params)
 * @param params The search criteria (VenueSearchQuery).
 * @returns PaginatedVenues results.
 */
export const searchVenues = async (params: VenueSearchQuery): Promise<PaginatedVenues> => {
	try {
		// Adjust endpoint if it's different, e.g., '/venues/search'
		const response = await apiClient.get<PaginatedVenues>('/venues', { params });
		return response.data;
	} catch (error) {
		console.error('Error searching venues:', error);
		throw error;
	}
};

/**
 * Updates an existing venue.
 * Corresponds to PATCH /venues/{venueId}
 * @param venueId The ID of the venue to update.
 * @param data The data to update (UpdateVenueInput).
 * @returns The updated Venue data.
 */
export const updateVenue = async (venueId: string, data: UpdateVenueInput): Promise<Venue> => {
	try {
		const response = await apiClient.patch<Venue>(`/venues/${venueId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Deletes a venue by its ID.
 * Corresponds to DELETE /venues/{venueId}
 * @param venueId The ID of the venue to delete.
 */
export const deleteVenue = async (venueId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}`);
		console.log(`Venue ${venueId} deleted successfully.`);
	} catch (error) {
		console.error(`Error deleting venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Transfers ownership of a venue.
 * Corresponds to POST /venues/{venueId}/transfer-ownership
 * @param venueId The ID of the venue.
 * @param data Input containing the new owner's ID.
 */
export const transferVenueOwnership = async (venueId: string, data: TransferVenueOwnershipInput): Promise<void> => {
	try {
		await apiClient.post(`/venues/${venueId}/transfer-ownership`, data);
		console.log(`Ownership of venue ${venueId} transferred successfully.`);
	} catch (error) {
		console.error(`Error transferring ownership for venue ${venueId}:`, error);
		throw error;
	}
};


// --- Venue Photo Operations ---

/**
 * Uploads a photo for a specific venue.
 * Corresponds to POST /venues/{venueId}/photos
 * @param venueId The ID of the venue.
 * @param file The photo file to upload.
 * @param caption Optional caption for the photo.
 * @param isPrimary Whether this photo should be the primary one.
 * @returns The created VenuePhoto data.
 */
export const addVenuePhoto = async (venueId: string, file: File, caption?: string, isPrimary?: boolean): Promise<VenuePhoto> => {
	const formData = new FormData();
	formData.append('photo', file); // Backend expects 'photo' key
	if (caption) formData.append('caption', caption);
	if (isPrimary !== undefined) formData.append('is_primary', String(isPrimary));

	try {
		const response = await apiClient.post<VenuePhoto>(`/venues/${venueId}/photos`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	} catch (error) {
		console.error(`Error adding photo to venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Fetches all photos for a specific venue.
 * Corresponds to GET /venues/{venueId}/photos
 * @param venueId The ID of the venue.
 * @returns An array of VenuePhoto objects.
 */
export const getVenuePhotos = async (venueId: string): Promise<VenuePhoto[]> => {
	try {
		const response = await apiClient.get<VenuePhoto[]>(`/venues/${venueId}/photos`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching photos for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Deletes a specific photo from a venue.
 * Corresponds to DELETE /venues/{venueId}/photos/{photoId}
 * @param venueId The ID of the venue.
 * @param photoId The ID of the photo to delete.
 */
export const deleteVenuePhoto = async (venueId: string, photoId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/photos/${photoId}`);
		console.log(`Photo ${photoId} deleted successfully from venue ${venueId}.`);
	} catch (error) {
		console.error(`Error deleting photo ${photoId} from venue ${venueId}:`, error);
		throw error;
	}
};

// --- Venue Staff Operations ---

/**
 * Adds a staff member to a venue.
 * Corresponds to POST /venues/{venueId}/staff
 * @param venueId The ID of the venue.
 * @param data The staff member details (AddVenueStaffInput).
 * @returns The created VenueStaff data.
 */
export const addVenueStaff = async (venueId: string, data: AddVenueStaffInput): Promise<VenueStaff> => {
	try {
		const response = await apiClient.post<VenueStaff>(`/venues/${venueId}/staff`, data);
		return response.data;
	} catch (error) {
		console.error(`Error adding staff to venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Fetches staff members for a specific venue.
 * Corresponds to GET /venues/{venueId}/staff
 * @param venueId The ID of the venue.
 * @param params Search/pagination criteria (VenueStaffSearchQuery).
 * @returns PaginatedVenueStaff results.
 */
export const getVenueStaff = async (venueId: string, params: VenueStaffSearchQuery): Promise<PaginatedVenueStaff> => {
	try {
		const response = await apiClient.get<PaginatedVenueStaff>(`/venues/${venueId}/staff`, { params });
		return response.data;
	} catch (error) {
		console.error(`Error fetching staff for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Updates a staff member's details for a venue.
 * Corresponds to PATCH /venues/{venueId}/staff/{staffId}
 * @param venueId The ID of the venue.
 * @param staffId The ID of the staff member to update.
 * @param data The data to update (UpdateVenueStaffInput).
 * @returns The updated VenueStaff data.
 */
export const updateVenueStaff = async (venueId: string, staffId: string, data: UpdateVenueStaffInput): Promise<VenueStaff> => {
	try {
		const response = await apiClient.patch<VenueStaff>(`/venues/${venueId}/staff/${staffId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating staff ${staffId} for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Removes a staff member from a venue.
 * Corresponds to DELETE /venues/{venueId}/staff/{staffId}
 * @param venueId The ID of the venue.
 * @param staffId The ID of the staff member to remove.
 */
export const removeVenueStaff = async (venueId: string, staffId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/staff/${staffId}`);
		console.log(`Staff ${staffId} removed successfully from venue ${venueId}.`);
	} catch (error) {
		console.error(`Error removing staff ${staffId} from venue ${venueId}:`, error);
		throw error;
	}
};

// --- Venue Settings Operations ---

/**
 * Fetches the settings for a specific venue.
 * Corresponds to GET /venues/{venueId}/settings
 * @param venueId The ID of the venue.
 * @returns The VenueSettings data.
 */
export const getVenueSettings = async (venueId: string): Promise<VenueSettings> => {
	try {
		const response = await apiClient.get<VenueSettings>(`/venues/${venueId}/settings`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching settings for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Updates the settings for a specific venue.
 * Corresponds to PATCH /venues/{venueId}/settings
 * @param venueId The ID of the venue.
 * @param data The settings data to update (UpdateVenueSettingsInput).
 * @returns The updated VenueSettings data.
 */
export const updateVenueSettings = async (venueId: string, data: UpdateVenueSettingsInput): Promise<VenueSettings> => {
	try {
		const response = await apiClient.patch<VenueSettings>(`/venues/${venueId}/settings`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating settings for venue ${venueId}:`, error);
		throw error;
	}
};

// --- Placeholder for Event, Product, Table services ---
// You would create similar functions for event, product, and table endpoints,
// importing their respective types from apiClient.ts.
// Example:
// --- Event Operations ---

/**
 * Creates an event for a specific venue.
 * Corresponds to POST /venues/{venueId}/events
 * @param venueId The ID of the venue.
 * @param data The event creation data (CreateEventInput).
 * @returns The created Event data.
 */
export const createEvent = async (venueId: string, data: CreateEventInput): Promise<Event> => {
	try {
		const response = await apiClient.post<Event>(`/venues/${venueId}/events`, data);
		return response.data;
	} catch (error) {
		console.error(`Error creating event for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Fetches an event by its ID for a specific venue.
 * Corresponds to GET /venues/{venueId}/events/{eventId}
 * @param venueId The ID of the venue.
 * @param eventId The ID of the event.
 * @returns The Event data.
 */
export const getEventById = async (venueId: string, eventId: string): Promise<Event> => {
	try {
		const response = await apiClient.get<Event>(`/venues/${venueId}/events/${eventId}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching event ${eventId} for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Searches for events within a specific venue.
 * Corresponds to GET /venues/{venueId}/events
 * @param venueId The ID of the venue.
 * @param params The search criteria (EventSearchQuery).
 * @returns PaginatedEvents results.
 */
export const searchEvents = async (venueId: string, params: EventSearchQuery): Promise<PaginatedEvents> => {
	try {
		const response = await apiClient.get<PaginatedEvents>(`/venues/${venueId}/events`, { params });
		return response.data;
	} catch (error) {
		console.error(`Error searching events for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Updates an event for a specific venue.
 * Corresponds to PATCH /venues/{venueId}/events/{eventId}
 * @param venueId The ID of the venue.
 * @param eventId The ID of the event.
 * @param data The data to update (UpdateEventInput).
 * @returns The updated Event data.
 */
export const updateEvent = async (venueId: string, eventId: string, data: UpdateEventInput): Promise<Event> => {
	try {
		const response = await apiClient.patch<Event>(`/venues/${venueId}/events/${eventId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating event ${eventId} for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Deletes an event for a specific venue.
 * Corresponds to DELETE /venues/{venueId}/events/{eventId}
 * @param venueId The ID of the venue.
 * @param eventId The ID of the event.
 */
export const deleteEvent = async (venueId: string, eventId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/events/${eventId}`);
		console.log(`Event ${eventId} deleted successfully for venue ${venueId}.`);
	} catch (error) {
		console.error(`Error deleting event ${eventId} for venue ${venueId}:`, error);
		throw error;
	}
};

// --- Event Photo Operations (Similar structure to Venue Photos) ---
export const addEventPhoto = async (venueId: string, eventId: string, file: File, caption?: string, isPrimary?: boolean): Promise<EventPhoto> => {
	const formData = new FormData();
	formData.append('photo', file);
	if (caption) formData.append('caption', caption);
	if (isPrimary !== undefined) formData.append('is_primary', String(isPrimary));
	try {
		const response = await apiClient.post<EventPhoto>(`/venues/${venueId}/events/${eventId}/photos`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	} catch (error) {
		console.error(`Error adding photo to event ${eventId}:`, error);
		throw error;
	}
}

export const getEventPhotos = async (venueId: string, eventId: string): Promise<EventPhoto[]> => {
	try {
		const response = await apiClient.get<EventPhoto[]>(`/venues/${venueId}/events/${eventId}/photos`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching photos for event ${eventId}:`, error);
		throw error;
	}
}

export const deleteEventPhoto = async (venueId: string, eventId: string, photoId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/events/${eventId}/photos/${photoId}`);
		console.log(`Photo ${photoId} deleted successfully from event ${eventId}.`);
	} catch (error) {
		console.error(`Error deleting photo ${photoId} from event ${eventId}:`, error);
		throw error;
	}
}

// --- Product Operations ---

/**
 * Creates a product (menu item) for a specific venue.
 * Corresponds to POST /venues/{venueId}/products
 * @param venueId The ID of the venue.
 * @param data The product creation data (CreateProductInput).
 * @returns The created Product data.
 */
export const createProduct = async (venueId: string, data: CreateProductInput): Promise<Product> => {
	try {
		const response = await apiClient.post<Product>(`/venues/${venueId}/products`, data);
		return response.data;
	} catch (error) {
		console.error(`Error creating product for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Fetches a product by its ID for a specific venue.
 * Corresponds to GET /venues/{venueId}/products/{productId}
 * @param venueId The ID of the venue.
 * @param productId The ID of the product.
 * @returns The Product data.
 */
export const getProductById = async (venueId: string, productId: string): Promise<Product> => {
	try {
		const response = await apiClient.get<Product>(`/venues/${venueId}/products/${productId}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching product ${productId} for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Searches for products within a specific venue.
 * Corresponds to GET /venues/{venueId}/products
 * @param venueId The ID of the venue.
 * @param params The search criteria (ProductSearchQuery).
 * @returns PaginatedProducts results.
 */
export const searchProducts = async (venueId: string, params: ProductSearchQuery): Promise<PaginatedProducts> => {
	try {
		const response = await apiClient.get<PaginatedProducts>(`/venues/${venueId}/products`, { params });
		return response.data;
	} catch (error) {
		console.error(`Error searching products for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Updates a product for a specific venue.
 * Corresponds to PATCH /venues/{venueId}/products/{productId}
 * @param venueId The ID of the venue.
 * @param productId The ID of the product.
 * @param data The data to update (UpdateProductInput).
 * @returns The updated Product data.
 */
export const updateProduct = async (venueId: string, productId: string, data: UpdateProductInput): Promise<Product> => {
	try {
		const response = await apiClient.patch<Product>(`/venues/${venueId}/products/${productId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating product ${productId} for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Deletes a product for a specific venue.
 * Corresponds to DELETE /venues/{venueId}/products/{productId}
 * @param venueId The ID of the venue.
 * @param productId The ID of the product.
 */
export const deleteProduct = async (venueId: string, productId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/products/${productId}`);
		console.log(`Product ${productId} deleted successfully for venue ${venueId}.`);
	} catch (error) {
		console.error(`Error deleting product ${productId} for venue ${venueId}:`, error);
		throw error;
	}
};

// --- Product Photo Operations ---

/**
 * Uploads a photo for a specific product.
 * Corresponds to POST /venues/{venueId}/products/{productId}/photos
 */
export const addProductPhoto = async (venueId: string, productId: string, file: File, caption?: string, isPrimary?: boolean): Promise<ProductPhoto> => {
	const formData = new FormData();
	formData.append('photo', file);
	if (caption) formData.append('caption', caption);
	if (isPrimary !== undefined) formData.append('is_primary', String(isPrimary));
	try {
		const response = await apiClient.post<ProductPhoto>(`/venues/${venueId}/products/${productId}/photos`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	} catch (error) {
		console.error(`Error adding photo to product ${productId}:`, error);
		throw error;
	}
};

/**
 * Fetches all photos for a specific product.
 * Corresponds to GET /venues/{venueId}/products/{productId}/photos
 */
export const getProductPhotos = async (venueId: string, productId: string): Promise<ProductPhoto[]> => {
	try {
		const response = await apiClient.get<ProductPhoto[]>(`/venues/${venueId}/products/${productId}/photos`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching photos for product ${productId}:`, error);
		throw error;
	}
};

/**
 * Deletes a specific photo from a product.
 * Corresponds to DELETE /venues/{venueId}/products/{productId}/photos/{photoId}
 */
export const deleteProductPhoto = async (venueId: string, productId: string, photoId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/products/${productId}/photos/${photoId}`);
		console.log(`Photo ${photoId} deleted successfully from product ${productId}.`);
	} catch (error) {
		console.error(`Error deleting photo ${photoId} from product ${productId}:`, error);
		throw error;
	}
};

// --- Product Option Operations ---
// Note: Input/Output types for options might need refinement based on exact API structure

/**
 * Adds a customization option to a product.
 * Corresponds to POST /venues/{venueId}/products/{productId}/options
 */
export const addProductOption = async (venueId: string, productId: string, data: Omit<ProductOption, 'id' | 'product_id' | 'created_at' | 'updated_at'>): Promise<ProductOption> => {
	try {
		const response = await apiClient.post<ProductOption>(`/venues/${venueId}/products/${productId}/options`, data);
		return response.data;
	} catch (error) {
		console.error(`Error adding option to product ${productId}:`, error);
		throw error;
	}
};

/**
 * Fetches all options for a specific product.
 * Corresponds to GET /venues/{venueId}/products/{productId}/options
 */
export const getProductOptions = async (venueId: string, productId: string): Promise<ProductOption[]> => {
	try {
		const response = await apiClient.get<ProductOption[]>(`/venues/${venueId}/products/${productId}/options`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching options for product ${productId}:`, error);
		throw error;
	}
};

/**
 * Updates a customization option for a product.
 * Corresponds to PATCH /venues/{venueId}/products/{productId}/options/{optionId}
 */
export const updateProductOption = async (venueId: string, productId: string, optionId: string, data: Partial<Omit<ProductOption, 'id' | 'product_id' | 'created_at' | 'updated_at'>>): Promise<ProductOption> => {
	try {
		const response = await apiClient.patch<ProductOption>(`/venues/${venueId}/products/${productId}/options/${optionId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating option ${optionId} for product ${productId}:`, error);
		throw error;
	}
};

/**
 * Deletes a customization option from a product.
 * Corresponds to DELETE /venues/{venueId}/products/{productId}/options/{optionId}
 */
export const deleteProductOption = async (venueId: string, productId: string, optionId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/products/${productId}/options/${optionId}`);
		console.log(`Option ${optionId} deleted successfully from product ${productId}.`);
	} catch (error) {
		console.error(`Error deleting option ${optionId} from product ${productId}:`, error);
		throw error;
	}
};

// --- Option Choice Operations ---
// Assuming endpoints like: /venues/{vId}/products/{pId}/options/{oId}/choices/{cId}

/**
 * Adds a choice to a product option.
 * Corresponds to POST /venues/{venueId}/products/{productId}/options/{optionId}/choices
 */
export const addOptionChoice = async (venueId: string, productId: string, optionId: string, data: Omit<OptionChoice, 'id' | 'option_id'>): Promise<OptionChoice> => {
	try {
		const response = await apiClient.post<OptionChoice>(`/venues/${venueId}/products/${productId}/options/${optionId}/choices`, data);
		return response.data;
	} catch (error) {
		console.error(`Error adding choice to option ${optionId}:`, error);
		throw error;
	}
};

/**
 * Updates a choice within a product option.
 * Corresponds to PATCH /venues/{venueId}/products/{productId}/options/{optionId}/choices/{choiceId}
 */
export const updateOptionChoice = async (venueId: string, productId: string, optionId: string, choiceId: string, data: Partial<Omit<OptionChoice, 'id' | 'option_id'>>): Promise<OptionChoice> => {
	try {
		const response = await apiClient.patch<OptionChoice>(`/venues/${venueId}/products/${productId}/options/${optionId}/choices/${choiceId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating choice ${choiceId} for option ${optionId}:`, error);
		throw error;
	}
};

/**
 * Deletes a choice from a product option.
 * Corresponds to DELETE /venues/{venueId}/products/{productId}/options/{optionId}/choices/{choiceId}
 */
export const deleteOptionChoice = async (venueId: string, productId: string, optionId: string, choiceId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/products/${productId}/options/${optionId}/choices/${choiceId}`);
		console.log(`Choice ${choiceId} deleted successfully from option ${optionId}.`);
	} catch (error) {
		console.error(`Error deleting choice ${choiceId} from option ${optionId}:`, error);
		throw error;
	}
};

// --- Table Operations ---

/**
 * Creates a table for a specific venue.
 * Corresponds to POST /venues/{venueId}/tables
 * @param venueId The ID of the venue.
 * @param data The table creation data (CreateTableInput).
 * @returns The created Table data.
 */
export const createTable = async (venueId: string, data: CreateTableInput): Promise<Table> => {
	try {
		const response = await apiClient.post<Table>(`/venues/${venueId}/tables`, data);
		return response.data;
	} catch (error) {
		console.error(`Error creating table for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Fetches a table by its ID for a specific venue.
 * Corresponds to GET /venues/{venueId}/tables/{tableId}
 * @param venueId The ID of the venue.
 * @param tableId The ID of the table.
 * @returns The Table data.
 */
export const getTableById = async (venueId: string, tableId: string): Promise<Table> => {
	try {
		const response = await apiClient.get<Table>(`/venues/${venueId}/tables/${tableId}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching table ${tableId} for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Searches for tables within a specific venue.
 * Corresponds to GET /venues/{venueId}/tables
 * @param venueId The ID of the venue.
 * @param params The search criteria (TableSearchQuery).
 * @returns PaginatedTables results.
 */
export const searchTables = async (venueId: string, params: TableSearchQuery): Promise<PaginatedTables> => {
	try {
		const response = await apiClient.get<PaginatedTables>(`/venues/${venueId}/tables`, { params });
		return response.data;
	} catch (error) {
		console.error(`Error searching tables for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Updates a table for a specific venue.
 * Corresponds to PATCH /venues/{venueId}/tables/{tableId}
 * @param venueId The ID of the venue.
 * @param tableId The ID of the table.
 * @param data The data to update (UpdateTableInput).
 * @returns The updated Table data.
 */
export const updateTable = async (venueId: string, tableId: string, data: UpdateTableInput): Promise<Table> => {
	try {
		const response = await apiClient.patch<Table>(`/venues/${venueId}/tables/${tableId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating table ${tableId} for venue ${venueId}:`, error);
		throw error;
	}
};

/**
 * Deletes a table for a specific venue.
 * Corresponds to DELETE /venues/{venueId}/tables/{tableId}
 * @param venueId The ID of the venue.
 * @param tableId The ID of the table.
 */
export const deleteTable = async (venueId: string, tableId: string): Promise<void> => {
	try {
		await apiClient.delete(`/venues/${venueId}/tables/${tableId}`);
		console.log(`Table ${tableId} deleted successfully for venue ${venueId}.`);
	} catch (error) {
		console.error(`Error deleting table ${tableId} for venue ${venueId}:`, error);
		throw error;
	}
};

// --- Table Map Operations ---
// Add GetTableMap, UpdateTableMap if endpoints exist
