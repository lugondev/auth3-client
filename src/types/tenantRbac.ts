// Types for Tenant-Specific RBAC Management
// Based on types in rbac.ts and adapted for tenant context

// State for the useTenantRbac hook
export interface TenantRbacLoadingState {
	initialRoles: boolean;
	rolePermissions: boolean;
	action: boolean; // For add/remove role/permission actions
}

export interface TenantRbacState {
	tenantId: string | null;
	roles: string[]; // List of role names for the tenant
	rolePermissionsMap: Record<string, string[][]>; // Maps roleName to its [object, action][]
	loading: TenantRbacLoadingState;
	error: string | null; // General error for fetching or non-specific actions
	createRoleError: string | null; // Specific error for role creation
	// selectedUser: UserOutput | null; // User selection might be handled by a parent user management component
	selectedRole: string | null; // Currently selected role for viewing/editing permissions
	// isUserRolesModalOpen: boolean; // User role assignment might be separate
	isRolePermsModalOpen: boolean;
	isCreateRoleModalOpen: boolean;
	newPermObject: string; // For the 'add permission' form in RolePermissionsModal
	newPermAction: string; // For the 'add permission' form in RolePermissionsModal
}

// Actions available from the useTenantRbac hook
export interface TenantRbacActions {
	fetchTenantRoles: (tenantId: string) => Promise<void>;
	fetchTenantRolePermissions: (tenantId: string, roleName: string) => Promise<void>;
	openRolePermsModal: (roleName: string) => void;
	closeRolePermsModal: () => void;
	openCreateRoleModal: () => void;
	closeCreateRoleModal: () => void;
	handleAddPermissionToTenantRole: (roleName: string | null, object: string, action: string) => Promise<void>;
	handleRemovePermissionFromTenantRole: (roleName: string | null, object: string, action: string) => Promise<void>;
	handleCreateTenantRole: (roleName: string, firstPermissionObject: string, firstPermissionAction: string) => Promise<void>; // Creating a role by assigning its first permission
	handleDeleteTenantRole: (roleName: string) => Promise<void>;
	setNewPermObject: (value: string) => void;
	setNewPermAction: (value: string) => void;
	setError: (error: string | null) => void;
	clearModalErrors: () => void;
	setTenantId: (tenantId: string) => void; // To set the tenant ID for the hook
}

// Return type of the useTenantRbac hook
export interface UseTenantRbacReturn extends TenantRbacState {
	actions: TenantRbacActions;
	groupedPermissions: (roleName: string | null) => Record<string, string[]>; // Helper to group permissions by object
}

// For the CreateRoleModal within tenant context
export interface CreateTenantRoleFormValues {
	roleName: string;
	// For tenant roles, we might create an empty role first or assign a default/first permission
	// Let's assume creating a role means giving it at least one initial permission.
	subject: string; // e.g., 'article', 'document'
	action: string; // e.g., 'read', 'write'
}

export interface TenantPermission {
	permissions: string[];
}
