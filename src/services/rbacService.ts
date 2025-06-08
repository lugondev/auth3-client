import apiClient from "@/lib/apiClient";
import {
	RoleListOutput,
	PermissionListOutput,
	UserRolesOutput,
	UserRoleInput,
	RolePermissionsOutput,
	RolePermissionInput,
	Role,
	CreateRoleFormValues,
	TenantRoleInput,
	TenantRoleOutput,
	TenantRoleListOutput,
	TenantUserRoleInput,
	TenantUserResponse,
	BulkUserRolesInput,
	BulkUserRolesResponse,
} from "@/types/rbac";

const RBAC_API_PREFIX = "/api/v1/admin/rbac";
const TENANT_API_PREFIX = "/api/v1/tenant";

// --- General RBAC Info ---

export const getAllRoles = async (): Promise<RoleListOutput> => {
	const response = await apiClient.get(`${RBAC_API_PREFIX}/roles`);
	return response.data;
};

export const getAllPermissions = async (): Promise<PermissionListOutput> => {
	const response = await apiClient.get(`${RBAC_API_PREFIX}/permissions`);
	return response.data;
};

// --- User Role Management ---

export const getRolesForUser = async (userId: string): Promise<UserRolesOutput> => {
	const response = await apiClient.get(`${RBAC_API_PREFIX}/users/${userId}/roles`);
	return response.data;
};

export const addRoleForUser = async (userId: string, data: UserRoleInput): Promise<void> => {
	await apiClient.post(`${RBAC_API_PREFIX}/users/${userId}/roles`, data);
};

export const removeRoleForUser = async (userId: string, role: string): Promise<void> => {
	await apiClient.delete(`${RBAC_API_PREFIX}/users/${userId}/roles/${role}`);
};

export const getRolesForUsers = async (data: BulkUserRolesInput): Promise<BulkUserRolesResponse[]> => {
	const response = await apiClient.post(`${RBAC_API_PREFIX}/users/roles`, data);
	return response.data;
};

// --- Tenant Role Management ---

export const getTenantRoles = async (tenantId: string): Promise<TenantRoleListOutput> => {
	const response = await apiClient.get(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles`);
	return response.data;
};

export const createTenantRole = async (tenantId: string, data: TenantRoleInput): Promise<TenantRoleOutput> => {
	const response = await apiClient.post(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles`, data);
	return response.data;
};

export const updateTenantRole = async (tenantId: string, roleName: string, data: TenantRoleInput): Promise<TenantRoleOutput> => {
	const response = await apiClient.put(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}`, data);
	return response.data;
};

export const deleteTenantRole = async (tenantId: string, roleName: string): Promise<void> => {
	await apiClient.delete(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}`);
};

// --- Tenant Role Permission Management ---

export const getTenantRolePermissions = async (tenantId: string, roleName: string): Promise<PermissionListOutput> => {
	const response = await apiClient.get(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}/permissions`);
	return response.data;
};

export const assignPermissionToTenantRole = async (
	tenantId: string,
	data: {
		role: string;
		permissions: { object: string; action: string }[];
	}
): Promise<void> => {
	await apiClient.post(`${TENANT_API_PREFIX}s/${tenantId}/rbac/roles/permissions`, data);
};

export const revokePermissionFromTenantRole = async (
	tenantId: string,
	roleName: string,
	object: string,
	action: string
): Promise<void> => {
	await apiClient.delete(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`);
};

// --- Tenant User Role Assignment ---

export const getTenantUserRoles = async (tenantId: string, userId: string): Promise<TenantUserResponse[]> => {
	const response = await apiClient.get(`${TENANT_API_PREFIX}/${tenantId}/users/${userId}`);
	return response.data;
};

export const assignRoleToTenantUser = async (
	tenantId: string,
	userId: string,
	data: TenantUserRoleInput
): Promise<void> => {
	await apiClient.post(`${TENANT_API_PREFIX}/${tenantId}/users/${userId}/roles`, data);
};

export const revokeRoleFromTenantUser = async (
	tenantId: string,
	userId: string,
	roleName: string
): Promise<void> => {
	await apiClient.delete(`${TENANT_API_PREFIX}/${tenantId}/users/${userId}/roles/${encodeURIComponent(roleName)}`);
};

// --- Role Permission Management ---

export const getPermissionsForRole = async (role: string, domain: string): Promise<RolePermissionsOutput> => {
	const response = await apiClient.get(`${RBAC_API_PREFIX}/roles/${encodeURIComponent(role)}/permissions/${domain}`);
	return response.data;
};

export const addPermissionForRole = async (domain: string, data: RolePermissionInput): Promise<void> => {
	await apiClient.post(`${RBAC_API_PREFIX}/roles/permissions/${domain}`, data);
};

export const createRole = async (data: CreateRoleFormValues): Promise<void> => {
	const payload = {
		role: data.roleName,
		domain: data.domain,
		permissions: [[data.subject, data.action]]
	};
	await apiClient.post(`${RBAC_API_PREFIX}/roles/permissions/${data.domain}`, payload);
};

export const removePermissionForRole = async (
	role: string,
	object: string,
	action: string
): Promise<void> => {
	await apiClient.delete(`${RBAC_API_PREFIX}/roles/${encodeURIComponent(role)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`);
};

export const deleteRole = async (role: Role): Promise<void> => {
	await apiClient.delete(`${RBAC_API_PREFIX}/roles/${encodeURIComponent(role.name)}/${role.domain}`);
};
