// Based on internal/modules/account/domain/dto.go (RBAC Management DTOs)

export interface UserRoleInput {
	userId: string; // uuid.UUID
	role: string;
}

export interface RolePermissionInput {
	role: string;
	permission: [string, string]; // [object, action]
}

// Not directly used as an API DTO in rbac_handler.go but defined in Go DTOs
export interface PermissionInput {
	object: string;
	action: string;
}

// RBAC Listing Responses

export interface RoleListOutput {
	roles: string[];
}

// Each item is a policy, typically [subject, domain, object, action] or [role, domain, object, action]
// The Go handler comment says [role, object, action], but Casbin policies can be more complex.
// For GetAllPermissions, it's likely the full policy string array.
export interface PermissionListOutput {
	permissions: string[][];
}

export interface UserRolesOutput {
	userId: string; // uuid.UUID
	roles: string[];
}

// Each item is an [object, action] pair for a specific role (and domain, implicitly)
export interface RolePermissionsOutput {
	role: string;
	permissions: string[][]; // Array of [object, action]
}
