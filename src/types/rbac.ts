// Based on internal/modules/account/domain/dto.go (RBAC Management DTOs)
import { UserOutput } from '@/lib/apiClient' // Assuming UserOutput is needed for selectedUser

export interface UserRoleInput {
	role: string
}

export interface RolePermissionInput {
	role: string
	permissions: [string, string][] // [object, action][]
}

// Not directly used as an API DTO in rbac_handler.go but defined in Go DTOs
export interface PermissionInput {
	object: string
	action: string
}

// RBAC Listing Responses
export interface RoleOutput {
	global: string[]
	tenant: string[]
}

export interface RoleListOutput {
	roles: RoleOutput
}

export interface RoleListTenantOutput {
	roles: string[]
}

// Each item is a policy, typically [subject, domain, object, action] or [role, domain, object, action]
// The Go handler comment says [role, object, action], but Casbin policies can be more complex.
// For GetAllPermissions, it's likely the full policy string array.
export interface PermissionListOutput {
	permissions: string[][]
}

export interface UserRolesOutput {
	userId: string // uuid.UUID
	roles: string[]
}

// Each item is an [object, action] pair for a specific role (and domain, implicitly)
export interface RolePermissionsOutput {
	role: string
	permissions: Array<[string, string]> // Array of [object, action] tuples
}

// --- Types for useRbac Hook ---

export interface RbacLoadingState {
	initial: boolean
	userRoles: boolean
	rolePermissions: boolean
	action: boolean
}

export interface Role {
	name: string
	domain: string
}

export interface RbacState {
	roles: Role[]
	users: UserOutput[]
	userRolesMap: Record<string, string[]> // userId -> roles[]
	rolePermissionsMap: Record<string, Array<[string, string]>> // roleName -> permissions[]
	loading: RbacLoadingState
	error: string | null
	createRoleError: string | null
	selectedUser: UserOutput | null
	selectedRole: Role | null
	isUserRolesModalOpen: boolean
	isRolePermsModalOpen: boolean
	isCreateRoleModalOpen: boolean
	newPermObject: string
	newPermAction: string
	searchQuery: string
}

export interface CreateRoleFormValues {
	roleName: string
	domain: 'global' | 'tenant'
	subject: string
	action: string
}

// This type is used as a payload for creating a role along with its first permission
export interface CreateRoleWithPermissionInput {
	domain: 'global' | 'tenant'
	role: string
	permissions: [string, string][] // [object, action][]
}


export interface RbacActions {
	fetchUsersRoles: (userIds: string[]) => Promise<void>
	fetchUserRoles: (userId: string) => Promise<void>
	fetchRolePermissions: (role: Role) => Promise<void>
	openUserRolesModal: (user: UserOutput) => void
	closeUserRolesModal: () => void
	openRolePermsModal: (role: Role) => void
	closeRolePermsModal: () => void
	openCreateRoleModal: () => void
	closeCreateRoleModal: () => void
	handleAddRoleToUser: (userId: string | undefined, roleName: string) => Promise<void>
	handleRemoveRoleFromUser: (userId: string | undefined, roleName: string) => Promise<void>
	handleAddPermissionToRole: (roleName: string | null, object: string, action: string, domain: string) => Promise<void>
	handleRemovePermissionFromRole: (roleName: string | null, object: string, action: string) => Promise<void>
	handleCreateRole: (data: CreateRoleFormValues) => Promise<void>
	setNewPermObject: (value: string) => void
	setNewPermAction: (value: string) => void
	setSearchQuery: (value: string) => void
	setError: (error: string | null) => void
	clearModalErrors: () => void
}

export interface UseRbacReturn extends RbacState {
	actions: RbacActions
	groupedPermissions: (role: Role | null) => Record<string, string[]>
	filteredUsers: UserOutput[]
}
