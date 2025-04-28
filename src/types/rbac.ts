import { UserOutput } from '@/lib/apiClient' // Assuming UserOutput is already defined well here

// --- API Response/Input Types ---

// From GET /rbac/roles
export interface RoleListOutput {
	roles: string[]
}

// From GET /rbac/users/{userId}/roles
export interface UserRolesOutput {
	userId: string
	roles: string[]
}

// For POST /rbac/users/roles
export interface UserRoleInput {
	userId: string
	role: string
}

// From GET /rbac/roles/{roleName}/permissions
export interface RolePermissionsOutput {
	role: string
	permissions: string[][] // Array of [object, action]
}

// For POST /rbac/roles/permissions (adding single permission)
// For POST /rbac/roles/permissions (creating role with initial permission) - This endpoint might need review for clarity
export interface RolePermissionInput {
	role: string
	permission: string[] // [object, action]
}

// For creating a new role (if a dedicated endpoint exists or adjusted payload)
// This specific structure was used in the original component for the creation form
export interface CreateRoleWithPermissionInput {
	role: string
	permission: string[] // [subject, action]
}

// --- Component/Hook Specific Types ---

// State slice for loading indicators
export interface RbacLoadingState {
	initial: boolean
	userRoles: boolean
	rolePermissions: boolean
	action: boolean // For add/remove/create operations
}

// Type for the state managed by the useRbac hook
export interface RbacState {
	roles: string[]
	users: UserOutput[]
	userRolesMap: Record<string, string[]> // userId -> roles[]
	rolePermissionsMap: Record<string, string[][]> // roleName -> permissions[][]
	loading: RbacLoadingState
	error: string | null
	createRoleError: string | null // Specific error for create role modal
	selectedUser: UserOutput | null
	selectedRole: string | null
	isUserRolesModalOpen: boolean
	isRolePermsModalOpen: boolean
	isCreateRoleModalOpen: boolean
	newPermObject: string
	newPermAction: string
	searchQuery: string
}

// Type for the actions returned by the useRbac hook
export interface RbacActions {
	fetchUserRoles: (userId: string) => Promise<void>
	fetchRolePermissions: (roleName: string) => Promise<void>
	openUserRolesModal: (user: UserOutput) => void
	closeUserRolesModal: () => void
	openRolePermsModal: (roleName: string) => void
	closeRolePermsModal: () => void
	openCreateRoleModal: () => void
	closeCreateRoleModal: () => void
	handleAddRoleToUser: (userId: string | undefined, roleName: string) => Promise<void>
	handleRemoveRoleFromUser: (userId: string | undefined, roleName: string) => Promise<void>
	handleAddPermissionToRole: (roleName: string | null, object: string, action: string) => Promise<void>
	handleRemovePermissionFromRole: (roleName: string | null, object: string, action: string) => Promise<void>
	handleCreateRole: (data: CreateRoleFormValues) => Promise<void> // Use the specific form values type
	setNewPermObject: (value: string) => void
	setNewPermAction: (value: string) => void
	setSearchQuery: (value: string) => void
	setError: (value: string | null) => void // Added setError for finer control if needed outside modals
	clearModalErrors: () => void // Helper to clear errors when modals close
}

// Return type of the useRbac hook
export type UseRbacReturn = RbacState & {
	actions: RbacActions
	groupedPermissions: (roleName: string | null) => Record<string, string[]>
	filteredUsers: UserOutput[]
}

// Type for Zod schema validation in CreateRoleModal
export interface CreateRoleFormValues {
	roleName: string
	subject: string
	action: string
}
