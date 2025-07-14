export interface TenantRole {
	name: string
	permissions: string[]
	description?: string
	isDefault?: boolean
	createdAt?: string
	updatedAt?: string
}

export interface CreateTenantRoleRequest {
	name: string
	description?: string
	permissions?: string[]
}

export interface UpdateTenantRoleRequest {
	description?: string
	permissions?: string[]
}

export interface TenantRolePermission {
	object: string
	action: string
	description?: string
}

export interface TenantRoleWithDetails extends TenantRole {
	userCount?: number
	isSystemRole?: boolean
}

export interface PaginatedTenantRolesResponse {
	roles: TenantRoleWithDetails[]
	total: number
	limit: number
	offset: number
	total_pages: number
	has_previous: boolean
	has_next: boolean
}
