import apiClient from "@/lib/apiClient";
import { withErrorHandling } from './errorHandlingService';
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
	BulkUserRolesInput,
	BulkUserRolesResponse,
} from "@/types/rbac";
import { TenantUserResponse } from "@/types/tenant";

const RBAC_API_PREFIX = "/api/v1/admin/rbac";
const TENANT_API_PREFIX = "/api/v1/tenant";

// --- General RBAC Info ---

export const getAllRoles = withErrorHandling(async (): Promise<RoleListOutput> => {
	const response = await apiClient.get<RoleListOutput>(`${RBAC_API_PREFIX}/roles`);
	return response.data;
});

export const getAllPermissions = withErrorHandling(async (): Promise<PermissionListOutput> => {
	const response = await apiClient.get<PermissionListOutput>(`${RBAC_API_PREFIX}/permissions`);
	return response.data;
});

// --- User Role Management ---

export const getRolesForUser = withErrorHandling(async (userId: string): Promise<UserRolesOutput> => {
	const response = await apiClient.get<UserRolesOutput>(`${RBAC_API_PREFIX}/users/${userId}/roles`);
	return response.data;
});

export const addRoleForUser = withErrorHandling(async (userId: string, data: UserRoleInput): Promise<void> => {
	await apiClient.post(`${RBAC_API_PREFIX}/users/${userId}/roles`, data);
});

export const removeRoleForUser = withErrorHandling(async (userId: string, role: string): Promise<void> => {
	await apiClient.delete(`${RBAC_API_PREFIX}/users/${userId}/roles/${role}`);
});

export const getRolesForUsers = withErrorHandling(async (data: BulkUserRolesInput): Promise<BulkUserRolesResponse[]> => {
	const response = await apiClient.post<BulkUserRolesResponse[]>(`${RBAC_API_PREFIX}/users/roles`, data);
	return response.data;
});

// --- Tenant Role Management ---

export const getTenantRoles = withErrorHandling(async (tenantId: string): Promise<TenantRoleListOutput> => {
	const response = await apiClient.get<TenantRoleListOutput>(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles`);
	return response.data;
});

export const createTenantRole = withErrorHandling(async (tenantId: string, data: TenantRoleInput): Promise<TenantRoleOutput> => {
	const response = await apiClient.post<TenantRoleOutput>(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles`, data);
	return response.data;
});

export const updateTenantRole = withErrorHandling(async (tenantId: string, roleName: string, data: TenantRoleInput): Promise<TenantRoleOutput> => {
	const response = await apiClient.put<TenantRoleOutput>(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}`, data);
	return response.data;
});

export const deleteTenantRole = withErrorHandling(async (tenantId: string, roleName: string): Promise<void> => {
	await apiClient.delete(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}`);
});

// --- Tenant Role Permission Management ---

export const getTenantRolePermissions = withErrorHandling(async (tenantId: string, roleName: string): Promise<PermissionListOutput> => {
	const response = await apiClient.get<PermissionListOutput>(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}/permissions`);
	return response.data;
});

export const assignPermissionToTenantRole = withErrorHandling(async (
	tenantId: string,
	data: {
		role: string;
		permissions: { object: string; action: string }[];
	}
): Promise<void> => {
	await apiClient.post(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/permissions`, data);
});

export const revokePermissionFromTenantRole = withErrorHandling(async (
	tenantId: string,
	roleName: string,
	object: string,
	action: string
): Promise<void> => {
	await apiClient.delete(`${TENANT_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`);
});

// --- Tenant User Role Assignment ---

export const getTenantUserRoles = withErrorHandling(async (tenantId: string, userId: string): Promise<TenantUserResponse[]> => {
	const response = await apiClient.get<TenantUserResponse[]>(`${TENANT_API_PREFIX}/${tenantId}/users/${userId}`);
	return response.data;
});

export const assignRoleToTenantUser = withErrorHandling(async (
	tenantId: string,
	userId: string,
	data: TenantUserRoleInput
): Promise<void> => {
	await apiClient.post(`${TENANT_API_PREFIX}/${tenantId}/users/${userId}/roles`, data);
});

export const revokeRoleFromTenantUser = withErrorHandling(async (
	tenantId: string,
	userId: string,
	roleName: string
): Promise<void> => {
	await apiClient.delete(`${TENANT_API_PREFIX}/${tenantId}/users/${userId}/roles/${encodeURIComponent(roleName)}`);
});

// --- Role Permission Management ---

export const getPermissionsForRole = withErrorHandling(async (role: string, domain: string): Promise<RolePermissionsOutput> => {
	const response = await apiClient.get<RolePermissionsOutput>(`${RBAC_API_PREFIX}/roles/${encodeURIComponent(role)}/permissions/${domain}`);
	return response.data;
});

export const addPermissionForRole = withErrorHandling(async (domain: string, data: RolePermissionInput): Promise<void> => {
	await apiClient.post(`${RBAC_API_PREFIX}/roles/permissions/${domain}`, data);
});

export const createRole = withErrorHandling(async (data: CreateRoleFormValues): Promise<void> => {
	const payload = {
		role: data.roleName,
		domain: data.domain,
		permissions: [[data.subject, data.action]]
	};
	await apiClient.post(`${RBAC_API_PREFIX}/roles/permissions/${data.domain}`, payload);
});

export const removePermissionForRole = withErrorHandling(async (
	role: string,
	object: string,
	action: string
): Promise<void> => {
	await apiClient.delete(`${RBAC_API_PREFIX}/roles/${encodeURIComponent(role)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`);
});

export const deleteRole = withErrorHandling(async (role: Role): Promise<void> => {
	await apiClient.delete(`${RBAC_API_PREFIX}/roles/${encodeURIComponent(role.name)}/${role.domain}`);
});
