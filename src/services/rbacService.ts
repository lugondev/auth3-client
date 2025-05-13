import apiClient from "@/lib/apiClient";
import {
	RoleListOutput,
	PermissionListOutput, // Re-added for global getAllPermissions
	UserRolesOutput,
	UserRoleInput,
	RolePermissionsOutput,
	RolePermissionInput, // Used for global, tenant might use simpler PermissionInput for POST
	PermissionInput, // For tenant-specific permission assignment
} from "@/types/rbac";

const RBAC_API_PREFIX = "/api/v1/rbac"; // apiClient already has /api/v1
const ADMIN_TENANTS_API_PREFIX = "/api/v1/admin/tenants";

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
// The 'domain' parameter corresponds to tenantId or a global placeholder.
// It's passed as a query parameter for GET or part of the context/implicit for POST/DELETE in backend.
// For simplicity, we might need to adjust how domain is passed if it's not a query param for GETs.
// The Go handler for GetRolesForUser uses `getDomainFromLocals(c)`, implying it's not a direct query param.
// Let's assume for now the backend handles domain contextually based on the authenticated user or tenant middleware.
// If explicit domain passing is needed for GETs, API needs adjustment or we pass it via headers/custom logic.

export const getRolesForUser = async (userId: string): Promise<UserRolesOutput> => {
	// Domain is assumed to be handled by backend context (e.g., tenant middleware)
	const response = await apiClient.get(`${RBAC_API_PREFIX}/users/${userId}/roles`);
	return response.data;
};

export const addRoleForUser = async (data: UserRoleInput): Promise<void> => {
	// Domain is assumed to be handled by backend context
	await apiClient.post(`${RBAC_API_PREFIX}/users/roles`, data);
};

export const removeRoleForUser = async (userId: string, role: string): Promise<void> => {
	// Domain is assumed to be handled by backend context
	await apiClient.delete(`${RBAC_API_PREFIX}/users/${userId}/roles/${role}`);
};

// --- Role Permission Management ---

export const getPermissionsForRole = async (role: string): Promise<RolePermissionsOutput> => {
	// Domain is assumed to be handled by backend context
	const response = await apiClient.get(`${RBAC_API_PREFIX}/roles/${role}/permissions`);
	return response.data;
};

export const addPermissionForRole = async (data: RolePermissionInput): Promise<void> => {
	// Domain is assumed to be handled by backend context
	await apiClient.post(`${RBAC_API_PREFIX}/roles/permissions`, data);
};

export const removePermissionForRole = async (
	role: string,
	object: string,
	action: string,
): Promise<void> => {
	// Domain is assumed to be handled by backend context
	await apiClient.delete(`${RBAC_API_PREFIX}/roles/${role}/permissions/${object}/${action}`);
};

// --- Tenant-Specific RBAC Operations ---

// GET /api/v1/admin/tenants/{tenant_id}/users/roles - List roles within a specific tenant
export const getTenantRoles = async (tenantId: string): Promise<RoleListOutput> => {
	const response = await apiClient.get(`${ADMIN_TENANTS_API_PREFIX}/${tenantId}/users/roles`);
	return response.data;
};

// DELETE /api/v1/admin/tenants/{tenant_id}/rbac/roles/{role_name} - Delete a role within a tenant
export const deleteTenantRole = async (tenantId: string, roleName: string): Promise<void> => {
	await apiClient.delete(`${ADMIN_TENANTS_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}`);
};

// GET /api/v1/admin/tenants/{tenant_id}/rbac/roles/{role_name}/permissions - List permissions for a specific role within a tenant
export const getTenantRolePermissions = async (tenantId: string, roleName: string): Promise<RolePermissionsOutput> => {
	const response = await apiClient.get(`${ADMIN_TENANTS_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}/permissions`);
	// Ensure the response structure matches RolePermissionsOutput, especially the 'role' field.
	// If the API doesn't return 'role' in the body, we might need to adjust or expect it.
	// For now, assuming it matches. If not, the hook using this will need to manage the roleName contextually.
	if (response.data && !response.data.role) {
		return { ...response.data, role: roleName }; // Add roleName if not present in response
	}
	return response.data;
};

// POST /api/v1/admin/tenants/{tenant_id}/rbac/roles/{role_name}/permissions - Assign a permission to a role within a tenant
export const assignPermissionToTenantRole = async (
	tenantId: string,
	roleName: string,
	data: PermissionInput, // { object: string, action: string }
): Promise<void> => {
	await apiClient.post(`${ADMIN_TENANTS_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}/permissions`, data);
};

// DELETE /api/v1/admin/tenants/{tenant_id}/rbac/roles/{role_name}/permissions/{object}/{action} - Revoke a specific permission
export const revokePermissionFromTenantRole = async (
	tenantId: string,
	roleName: string,
	object: string,
	action: string,
): Promise<void> => {
	await apiClient.delete(
		`${ADMIN_TENANTS_API_PREFIX}/${tenantId}/rbac/roles/${encodeURIComponent(roleName)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`,
	);
};

// Note: Creating a tenant role might be implicit via assigning the first permission
// or might require a dedicated endpoint if one exists.
// The CreateRoleModal will likely use assignPermissionToTenantRole with a new roleName.
