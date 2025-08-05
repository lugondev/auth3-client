import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import { AddUserToTenantRequest, PaginatedTenantsResponse, PaginatedTenantUsersResponse, TenantResponse, TenantUserResponse, UpdateTenantRequest, UpdateTenantUserRequest, CreateTenantRequest } from '@/types/tenant';
import { OwnedTenantsResponse, JoinedTenantsResponse } from '@/types/tenantManagement';
import { TenantPermission } from '@/types/tenantRbac';
import { TenantRoleListOutput } from '@/types';
import { ListUserDIDsInTenantResponse } from '@/types/tenantUserDID';
import { ListTenantDIDsResponse } from '@/types/tenantDID';
import { ListTenantMemberDIDsResponse } from '@/types/tenantMemberDID';

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

// Role Management
export const getTenantRoles = withErrorHandling(async (tenantId: string): Promise<TenantRoleListOutput> => {
	const response = await apiClient.get<TenantRoleListOutput>(`/api/v1/tenants/${tenantId}/rbac/roles`);
	return response.data;
});

export const createTenantRole = withErrorHandling(async (tenantId: string, roleName: string): Promise<void> => {
	await apiClient.post(`/api/v1/tenants/${tenantId}/rbac/roles/${roleName}`);
});

export const deleteTenantRole = withErrorHandling(async (tenantId: string, roleName: string): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}/rbac/roles/${roleName}`);
});

export const getTenantRolePermissions = withErrorHandling(async (tenantId: string, roleName: string): Promise<string[]> => {
	const response = await apiClient.get<string[]>(`/api/v1/tenants/${tenantId}/rbac/roles/${roleName}/permissions`);
	return response.data;
});

export const addTenantRolePermission = withErrorHandling(async (
	tenantId: string, 
	roleName: string, 
	object: string, 
	action: string
): Promise<void> => {
	await apiClient.post(`/api/v1/tenants/${tenantId}/rbac/roles/${roleName}/permissions/${object}/${action}`);
});

export const removeTenantRolePermission = withErrorHandling(async (
	tenantId: string, 
	roleName: string, 
	object: string, 
	action: string
): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}/rbac/roles/${roleName}/permissions/${object}/${action}`);
});

// Transfer tenant ownership
export const transferTenantOwnership = withErrorHandling(async (tenantId: string, newOwnerEmail: string): Promise<void> => {
	await apiClient.put(`/api/v1/tenants/${tenantId}/transfer-ownership`, {
		new_owner_email: newOwnerEmail,
	});
});

// Get user DIDs in tenant
export const getUserDIDsInTenant = withErrorHandling(async (
	tenantId: string, 
	userId: string, 
	limit: number = 20, 
	offset: number = 0
): Promise<ListUserDIDsInTenantResponse> => {
	const response = await apiClient.get<ListUserDIDsInTenantResponse>(`/api/v1/tenants/${tenantId}/users/${userId}/dids`, {
		params: { limit, offset },
	});
	return response.data;
});

// Get all DIDs in tenant (tenant-owned DIDs)
export const getTenantOwnedDIDs = withErrorHandling(async (
	tenantId: string,
	filters?: {
		method?: string;
		status?: string;
		ownership_type?: string;
		limit?: number;
		offset?: number;
	}
): Promise<ListTenantDIDsResponse> => {
	const response = await apiClient.get<ListTenantDIDsResponse>(`/api/v1/tenants/${tenantId}/dids`, {
		params: filters,
	});
	return response.data;
});

// Get all DIDs of tenant members
export const getTenantMemberDIDs = withErrorHandling(async (
	tenantId: string,
	filters?: {
		search?: string;
		limit?: number;
		offset?: number;
	}
): Promise<ListTenantMemberDIDsResponse> => {
	const response = await apiClient.get<ListTenantMemberDIDsResponse>(`/api/v1/tenants/${tenantId}/members/dids`, {
		params: filters,
	});
	return response.data;
});

// Backwards compatibility - deprecated, use getTenantOwnedDIDs for tenant-owned DIDs
export const getTenantDIDs = getTenantOwnedDIDs;