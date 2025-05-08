import apiClient, {
	TenantResponse,
	CreateTenantRequest,
	UpdateTenantRequest,
	PaginatedTenants, // Assuming a paginated response for tenants list
	TenantUserResponse,
	AddUserToTenantRequest,
	UpdateTenantUserRequest,
	PaginatedTenantUsers, // Assuming a paginated response for tenant users list
	BaseSearchQuery, // For general pagination/query params
	UserTenantMembershipInfo, // Import the DTO for the new function
	// RoleResponse as ApiRoleResponse, // If RoleResponse from apiClient is just string[]
} from '@/lib/apiClient';

// --- Role Types ---
export interface Role {
	id: string;
	name: string;
	description?: string;
	// Add other role properties if available from backend
}

export interface PaginatedRoles {
	roles: Role[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}


// --- Tenant Management ---

/**
 * Creates a new tenant.
 * @param data The data for creating a new tenant.
 * @returns The created TenantResponse data.
 */
export const createTenant = async (data: CreateTenantRequest): Promise<TenantResponse> => {
	try {
		const response = await apiClient.post<TenantResponse>('/api/v1/tenants', data);
		return response.data;
	} catch (error) {
		console.error('Error creating tenant:', error);
		throw error;
	}
};

/**
 * Fetches a list of tenants.
 * @param params Query parameters for pagination and searching.
 * @returns Paginated list of TenantResponse data.
 */
export const getTenants = async (params: BaseSearchQuery): Promise<PaginatedTenants> => {
	try {
		const response = await apiClient.get<PaginatedTenants>('/api/v1/tenants', { params });
		return response.data;
	} catch (error) {
		console.error('Error fetching tenants:', error);
		throw error;
	}
};

/**
 * Fetches a single tenant by its ID.
 * @param tenantId The ID of the tenant to fetch.
 * @returns The TenantResponse data.
 */
export const getTenantById = async (tenantId: string): Promise<TenantResponse> => {
	try {
		const response = await apiClient.get<TenantResponse>(`/api/v1/tenants/${tenantId}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching tenant ${tenantId}:`, error);
		throw error;
	}
};

/**
 * Updates an existing tenant.
 * @param tenantId The ID of the tenant to update.
 * @param data The data to update the tenant with.
 * @returns The updated TenantResponse data.
 */
export const updateTenant = async (tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse> => {
	try {
		const response = await apiClient.patch<TenantResponse>(`/api/v1/tenants/${tenantId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating tenant ${tenantId}:`, error);
		throw error;
	}
};

/**
 * Deletes a tenant by its ID.
 * @param tenantId The ID of the tenant to delete.
 * @returns A success message or void.
 */
export const deleteTenant = async (tenantId: string): Promise<void> => { // Assuming backend returns 204 No Content or similar
	try {
		await apiClient.delete(`/api/v1/tenants/${tenantId}`);
	} catch (error) {
		console.error(`Error deleting tenant ${tenantId}:`, error);
		throw error;
	}
};

// --- Tenant User Management ---

/**
 * Adds a user to a specific tenant.
 * @param tenantId The ID of the tenant.
 * @param data The data for adding the user (email and roles).
 * @returns The TenantUserResponse data for the added user.
 */
export const addUserToTenant = async (tenantId: string, data: AddUserToTenantRequest): Promise<TenantUserResponse> => {
	try {
		const response = await apiClient.post<TenantUserResponse>(`/api/v1/tenants/${tenantId}/users`, data);
		return response.data;
	} catch (error) {
		console.error(`Error adding user to tenant ${tenantId}:`, error);
		throw error;
	}
};

/**
 * Fetches a list of users for a specific tenant.
 * @param tenantId The ID of the tenant.
 * @param params Query parameters for pagination and searching.
 * @returns Paginated list of TenantUserResponse data.
 */
export const getTenantUsers = async (tenantId: string, params: BaseSearchQuery): Promise<PaginatedTenantUsers> => {
	try {
		const response = await apiClient.get<PaginatedTenantUsers>(`/api/v1/tenants/${tenantId}/users`, { params });
		return response.data;
	} catch (error) {
		console.error(`Error fetching users for tenant ${tenantId}:`, error);
		throw error;
	}
};

/**
 * Updates a user's details within a specific tenant.
 * @param tenantId The ID of the tenant.
 * @param userId The ID of the user to update.
 * @param data The data to update the user with (roles, status).
 * @returns The updated TenantUserResponse data.
 */
export const updateTenantUser = async (tenantId: string, userId: string, data: UpdateTenantUserRequest): Promise<TenantUserResponse> => {
	try {
		const response = await apiClient.patch<TenantUserResponse>(`/api/v1/tenants/${tenantId}/users/${userId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating user ${userId} in tenant ${tenantId}:`, error);
		throw error;
	}
};

/**
 * Removes a user from a specific tenant.
 * @param tenantId The ID of the tenant.
 * @param userId The ID of the user to remove.
 * @returns A success message or void.
 */
export const removeUserFromTenant = async (tenantId: string, userId: string): Promise<void> => { // Assuming 204 No Content
	try {
		await apiClient.delete(`/api/v1/tenants/${tenantId}/users/${userId}`);
	} catch (error) {
		console.error(`Error removing user ${userId} from tenant ${tenantId}:`, error);
		throw error;
	}
};

// --- User's Own Tenant Operations ---

/**
 * Fetches the list of tenants the currently authenticated user is a member of.
 * @returns A promise that resolves to an array of UserTenantMembershipInfo.
 */
export const getUserTenants = async (): Promise<UserTenantMembershipInfo[]> => {
	try {
		// The backend is expected to return a structure like { data: UserTenantMembershipInfo[] }
		// based on the utils.RespondWithSuccess structure.
		const response = await apiClient.get<{ data: UserTenantMembershipInfo[] }>('/api/v1/me/tenants');
		return response.data.data; // Access the nested data array
	} catch (error) {
		console.error('Error fetching user tenants:', error);
		throw error; // Rethrow to be handled by the caller (e.g., AuthContext)
	}
};

// --- Tenant Role Management ---

/**
 * Fetches a list of roles available for a specific tenant.
 * @param tenantId The ID of the tenant.
 * @param params Query parameters for pagination and searching.
 * @returns Paginated list of Role data.
 */
export const getTenantRoles = async (tenantId: string, params?: BaseSearchQuery): Promise<PaginatedRoles> => {
	try {
		// Assuming an endpoint like /tenants/{tenantId}/roles or /roles?tenantId={tenantId}
		// Adjust endpoint as per actual API design
		const response = await apiClient.get<PaginatedRoles>(`/api/v1/tenants/${tenantId}/roles`, { params });
		return response.data;
	} catch (error) {
		console.error(`Error fetching roles for tenant ${tenantId}:`, error);
		throw error;
	}
};
