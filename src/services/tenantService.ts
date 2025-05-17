import apiClient from '@/lib/apiClient';
import { AddUserToTenantRequest, PaginatedTenantsResponse, PaginatedTenantUsersResponse, TenantResponse, TenantUserResponse, UpdateTenantRequest, UpdateTenantUserRequest } from '@/types/tenant';
import { OwnedTenantsResponse, JoinedTenantsResponse } from '@/types/tenantManagement';
import { TenantPermission } from '@/types/tenantRbac'; // Import the new type

export const listTenants = async (limit: number = 10, offset: number = 0): Promise<PaginatedTenantsResponse> => {
	const response = await apiClient.get(`/api/v1/tenants/list`, {
		params: { limit, offset },
	});
	return response.data;
};

export const getTenantById = async (tenantId: string): Promise<TenantResponse> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}`);
	return response.data;
};


export const getOwnedTenants = async (limit: number, offset: number): Promise<OwnedTenantsResponse> => {
	const response = await apiClient.get('/api/v1/me/tenants/owned', {
		params: {
			limit,
			offset,
		},
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

export const getJoinedTenants = async (limit: number, offset: number): Promise<JoinedTenantsResponse> => {
	const response = await apiClient.get('/api/v1/me/tenants', {
		params: {
			limit,
			offset,
		},
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

export const getTenantPermissions = async (tenantId: string): Promise<TenantPermission> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}/permissions`);
	return response.data; // Assuming the response data matches the TenantPermission type
};

export const updateUserRoleInTenant = async (
	tenantId: string,
	userId: string,
	role: string
): Promise<TenantUserResponse> => {
	const response = await apiClient.put(`/api/v1/tenants/${tenantId}/users/${userId}/role`, { role });
	return response.data;
};

export const removeUserFromTenant = async (tenantId: string, userId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}/users/${userId}`);
};

// Check if email exists
export const checkEmailExists = async (email: string): Promise<{ exists: boolean; email?: string }> => {
	const response = await apiClient.get(`/api/v1/users/is-email-exists`, {
		params: { email },
	});
	return response.data;
};

// Transfer tenant ownership
export const transferTenantOwnership = async (tenantId: string, newOwnerEmail: string): Promise<void> => {
	await apiClient.put(`/api/v1/tenants/${tenantId}/transfer-ownership`, {
		new_owner_email: newOwnerEmail,
	});
}
