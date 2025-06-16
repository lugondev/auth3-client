import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import { AddUserToTenantRequest, PaginatedTenantsResponse, PaginatedTenantUsersResponse, TenantResponse, TenantUserResponse, UpdateTenantRequest, UpdateTenantUserRequest, CreateTenantRequest } from '@/types/tenant';
import { OwnedTenantsResponse, JoinedTenantsResponse } from '@/types/tenantManagement';
import { TenantPermission } from '@/types/tenantRbac';

// Tenant CRUD Operations
export const createTenant = withErrorHandling(async (data: CreateTenantRequest): Promise<TenantResponse> => {
	const response = await apiClient.post<TenantResponse>('/api/v1/tenants', data);
	return response.data;
});

export const listTenants = withErrorHandling(async (limit: number = 10, offset: number = 0): Promise<PaginatedTenantsResponse> => {
	const response = await apiClient.get<PaginatedTenantsResponse>('/api/v1/tenants', {
		params: { limit, offset },
	});
	return response.data;
});

export const getTenantById = withErrorHandling(async (tenantId: string): Promise<TenantResponse> => {
	const response = await apiClient.get<TenantResponse>(`/api/v1/tenants/${tenantId}`);
	return response.data;
});


export const getOwnedTenants = withErrorHandling(async (limit: number, offset: number): Promise<OwnedTenantsResponse> => {
	const response = await apiClient.get<OwnedTenantsResponse>('/api/v1/me/tenants/owned', {
		params: {
			limit,
			offset,
		},
	});
	return response.data;
});


export const updateTenant = withErrorHandling(async (tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse> => {
	const response = await apiClient.put<TenantResponse>(`/api/v1/tenants/${tenantId}`, data);
	return response.data;
});

export const deleteTenant = withErrorHandling(async (tenantId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}`);
});

// Tenant User Management
export const addUserToTenant = withErrorHandling(async (tenantId: string, data: AddUserToTenantRequest): Promise<TenantUserResponse> => {
	const response = await apiClient.post<TenantUserResponse>(`/api/v1/tenants/${tenantId}/users`, data);
	return response.data;
});

export const listUsersInTenant = withErrorHandling(async (
	tenantId: string,
	limit: number = 10,
	offset: number = 0,
): Promise<PaginatedTenantUsersResponse> => {
	const response = await apiClient.get<PaginatedTenantUsersResponse>(`/api/v1/tenants/${tenantId}/users`, {
		params: { limit, offset },
	});
	return response.data;
});

export const getJoinedTenants = withErrorHandling(async (limit: number, offset: number): Promise<JoinedTenantsResponse> => {
	const response = await apiClient.get<JoinedTenantsResponse>('/api/v1/me/tenants', {
		params: {
			limit,
			offset,
		},
	});
	return response.data;
});

export const getTenantUserDetails = withErrorHandling(async (tenantId: string, userId: string): Promise<TenantUserResponse> => {
	const response = await apiClient.get<TenantUserResponse>(`/api/v1/tenants/${tenantId}/users/${userId}`);
	return response.data;
});

export const updateUserInTenant = withErrorHandling(async (
	tenantId: string,
	userId: string,
	data: UpdateTenantUserRequest,
): Promise<TenantUserResponse> => {
	const response = await apiClient.put<TenantUserResponse>(`/api/v1/tenants/${tenantId}/users/${userId}`, data);
	return response.data;
});

export const getTenantPermissions = withErrorHandling(async (tenantId: string): Promise<TenantPermission> => {
	const response = await apiClient.get<TenantPermission>(`/api/v1/tenants/${tenantId}/permissions`);
	return response.data;
});

export const updateUserRoleInTenant = withErrorHandling(async (
	tenantId: string,
	userId: string,
	role: string
): Promise<TenantUserResponse> => {
	const response = await apiClient.put<TenantUserResponse>(`/api/v1/tenants/${tenantId}/users/${userId}/role`, { role });
	return response.data;
});

export const removeUserFromTenant = withErrorHandling(async (tenantId: string, userId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}/users/${userId}`);
});

// Check if email exists
export const checkEmailExists = withErrorHandling(async (email: string): Promise<{ exists: boolean; email?: string }> => {
	const response = await apiClient.get<{ exists: boolean; email?: string }>(`/api/v1/users/is-email-exists`, {
		params: { email },
	});
	return response.data;
});

// Transfer tenant ownership
export const transferTenantOwnership = withErrorHandling(async (tenantId: string, newOwnerEmail: string): Promise<void> => {
	await apiClient.put(`/api/v1/tenants/${tenantId}/transfer-ownership`, {
		new_owner_email: newOwnerEmail,
	});
});