import apiClient from "@/lib/apiClient";
import {
	AddUserToTenantRequest,
	// CreateTenantRequest, // Removed as it's unused
	PaginatedTenantsResponse,
	PaginatedTenantUsersResponse,
	TenantResponse,
	TenantUserResponse,
	UpdateTenantRequest,
	UpdateTenantUserRequest,
	UserTenantMembershipInfo,
} from "@/types/tenant";
import {
	JoinedTenantsResponse,
	OwnedTenantsResponse,
	CreateTenantPayload,
	CreateTenantResponse,
	// AllTenantsResponse, // listTenants can be used for this
} from "@/types/tenantManagement";

// Tenant CRUD operations
export const createTenant = async (data: CreateTenantPayload): Promise<CreateTenantResponse> => {
	const response = await apiClient.post(`/api/v1/tenants`, data);
	return response.data;
};

export const getTenantById = async (tenantId: string): Promise<TenantResponse> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}`);
	return response.data;
};

export const listTenants = async (limit: number = 10, offset: number = 0): Promise<PaginatedTenantsResponse> => {
	const response = await apiClient.get(`/api/v1/tenants`, {
		params: { limit, offset },
	});
	return response.data;
};

export const updateTenant = async (tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse> => {
	const response = await apiClient.put(`/api/v1/tenants/${tenantId}`, data);
	return response.data;
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}`);
};

// Tenant User Management
export const addUserToTenant = async (tenantId: string, data: AddUserToTenantRequest): Promise<TenantUserResponse> => {
	const response = await apiClient.post(`/api/v1/tenants/${tenantId}/users`, data);
	return response.data;
};

export const listUsersInTenant = async (
	tenantId: string,
	limit: number = 10,
	offset: number = 0,
): Promise<PaginatedTenantUsersResponse> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}/users`, {
		params: { limit, offset },
	});
	return response.data;
};

export const getTenantUserDetails = async (tenantId: string, userId: string): Promise<TenantUserResponse> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}/users/${userId}`);
	return response.data;
};

export const updateUserInTenant = async (
	tenantId: string,
	userId: string,
	data: UpdateTenantUserRequest,
): Promise<TenantUserResponse> => {
	const response = await apiClient.put(`/api/v1/tenants/${tenantId}/users/${userId}`, data);
	return response.data;
};

export const removeUserFromTenant = async (tenantId: string, userId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}/users/${userId}`);
};

// User's own tenant list
export const listMyTenants = async (): Promise<UserTenantMembershipInfo[]> => {
	const response = await apiClient.get(`/api/v1/me/tenants`);
	// The backend returns UserTenantMembershipInfo directly, not an object with a key.
	// However, the DTO shows it as `domain.UserTenantMembershipInfo` which is an array.
	// Let's assume the backend returns an array directly.
	return response.data;
};

// It seems the backend handler for ListUserTenantsHandler returns `memberships` which is `[]*UserTenantMembershipInfo`
// So the response.data should already be UserTenantMembershipInfo[]

// Functions for the new Tenant Management Page
export const getJoinedTenants = async (params: { limit?: number; offset?: number } = {}): Promise<JoinedTenantsResponse> => {
	const response = await apiClient.get(`/api/v1/me/tenants`, { params });
	return response.data;
};

export const getOwnedTenants = async (params: { limit?: number; offset?: number } = {}): Promise<OwnedTenantsResponse> => {
	const response = await apiClient.get(`/api/v1/me/tenants/owned`, { params });
	return response.data;
};

// The existing `listTenants` function can be used for fetching all tenants for an admin.
// export const getAllTenantsForAdmin = async (params: { limit?: number; offset?: number } = {}): Promise<AllTenantsResponse> => {
//   const response = await apiClient.get(`/api/v1/tenants`, { params });
//   return response.data;
// };

// Check if email exists
export const checkEmailExists = async (email: string): Promise<{ exists: boolean; email?: string }> => {
	const response = await apiClient.get(`/api/v1/users/check-email-exists`, {
		params: { email },
	});
	return response.data;
};

// Transfer tenant ownership
export const transferTenantOwnership = async (tenantId: string, newOwnerEmail: string): Promise<void> => {
	await apiClient.put(`/api/v1/tenants/${tenantId}/transfer-ownership`, {
		new_owner_email: newOwnerEmail,
	});
};
