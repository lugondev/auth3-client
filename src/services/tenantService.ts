import apiClient from "@/lib/apiClient";
import {
	AddUserToTenantRequest,
	CreateTenantRequest,
	PaginatedTenantsResponse,
	PaginatedTenantUsersResponse,
	TenantResponse,
	TenantUserResponse,
	UpdateTenantRequest,
	UpdateTenantUserRequest,
	UserTenantMembershipInfo,
} from "@/types/tenant";

// Tenant CRUD operations
export const createTenant = async (data: CreateTenantRequest): Promise<TenantResponse> => {
	const response = await apiClient.post(`/api/v1/admin/tenants`, data);
	return response.data;
};

export const getTenantById = async (tenantId: string): Promise<TenantResponse> => {
	const response = await apiClient.get(`/api/v1/admin/tenants/${tenantId}`);
	return response.data;
};

export const listTenants = async (limit: number = 10, offset: number = 0): Promise<PaginatedTenantsResponse> => {
	const response = await apiClient.get(`/api/v1/admin/tenants`, {
		params: { limit, offset },
	});
	return response.data;
};

export const updateTenant = async (tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse> => {
	const response = await apiClient.put(`/api/v1/admin/tenants/${tenantId}`, data);
	return response.data;
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/admin/tenants/${tenantId}`);
};

// Tenant User Management
export const addUserToTenant = async (tenantId: string, data: AddUserToTenantRequest): Promise<TenantUserResponse> => {
	const response = await apiClient.post(`/api/v1/admin/tenants/${tenantId}/users`, data);
	return response.data;
};

export const listUsersInTenant = async (
	tenantId: string,
	limit: number = 10,
	offset: number = 0,
): Promise<PaginatedTenantUsersResponse> => {
	const response = await apiClient.get(`/api/v1/admin/tenants/${tenantId}/users`, {
		params: { limit, offset },
	});
	return response.data;
};

export const getTenantUserDetails = async (tenantId: string, userId: string): Promise<TenantUserResponse> => {
	const response = await apiClient.get(`/api/v1/admin/tenants/${tenantId}/users/${userId}`);
	return response.data;
};

export const updateUserInTenant = async (
	tenantId: string,
	userId: string,
	data: UpdateTenantUserRequest,
): Promise<TenantUserResponse> => {
	const response = await apiClient.put(`/api/v1/admin/tenants/${tenantId}/users/${userId}`, data);
	return response.data;
};

export const removeUserFromTenant = async (tenantId: string, userId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/admin/tenants/${tenantId}/users/${userId}`);
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
