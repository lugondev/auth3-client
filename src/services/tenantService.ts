import apiClient from '@/lib/apiClient';
import { AddUserToTenantRequest, PaginatedTenantsResponse, PaginatedTenantUsersResponse, TenantResponse, TenantUserResponse, UpdateTenantRequest, UpdateTenantUserRequest } from '@/types/tenant';
import { OwnedTenantsResponse, JoinedTenantsResponse } from '@/types/tenantManagement';
import { TenantPermission } from '@/types/tenantRbac';
import { TenantRoleInput, TenantRoleOutput, TenantRoleListOutput } from '@/types/rbac';

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
};

// --- Tenant Role Management ---

/**
 * Gets all roles (template and custom) for a specific tenant
 */
export const getAllTenantRoles = async (tenantId: string): Promise<TenantRoleListOutput> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}/roles`);
	return response.data;
};

/**
 * Creates a new custom role for a tenant
 */
export const createTenantRole = async (tenantId: string, data: TenantRoleInput): Promise<TenantRoleOutput> => {
	const response = await apiClient.post(`/api/v1/tenants/${tenantId}/roles`, data);
	return response.data;
};

/**
 * Updates a custom tenant role (template roles cannot be modified)
 */
export const updateTenantRole = async (
	tenantId: string,
	roleId: string,
	data: TenantRoleInput
): Promise<TenantRoleOutput> => {
	const response = await apiClient.put(`/api/v1/tenants/${tenantId}/roles/${roleId}`, data);
	return response.data;
};

/**
 * Deletes a custom tenant role (template roles cannot be deleted)
 */
export const deleteTenantRole = async (tenantId: string, roleId: string): Promise<void> => {
	await apiClient.delete(`/api/v1/tenants/${tenantId}/roles/${roleId}`);
};

/**
 * Applies a role template to a tenant
 */
export const applyTemplateToTenant = async (
	tenantId: string,
	templateId: string
): Promise<void> => {
	await apiClient.post(`/api/v1/tenants/${tenantId}/roles/apply-template`, { template_id: templateId });
};

/**
 * Gets a specific tenant role by ID
 */
export const getTenantRoleById = async (tenantId: string, roleId: string): Promise<TenantRoleOutput> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}/roles/${roleId}`);
	return response.data;
};

/**
 * Gets only template roles for a tenant
 */
export const getTenantTemplateRoles = async (tenantId: string): Promise<TenantRoleOutput[]> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}/roles?template_only=true`);
	return response.data.template_roles || [];
};

/**
 * Gets only custom roles for a tenant
 */
export const getTenantCustomRoles = async (tenantId: string): Promise<TenantRoleOutput[]> => {
	const response = await apiClient.get(`/api/v1/tenants/${tenantId}/roles?custom_only=true`);
	return response.data.custom_roles || [];
};
