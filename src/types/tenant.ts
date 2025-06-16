// Based on internal/modules/tenant/domain/dto.go

export interface CreateTenantRequest {
	name: string;
	slug: string;
	owner_email: string;
}

export interface TenantResponse {
	id: string; // uuid.UUID
	name: string;
	slug: string;
	owner_user_id: string; // uuid.UUID
	owner?: {
		email: string;
		first_name: string | null;
		last_name: string | null;
	}; // Added owner information to match backend response
	is_active: boolean;
	metadata?: number[]; // byte array from backend
	version?: number; // version tracking
	created_by?: string; // user ID who created the tenant
	updated_by?: string; // user ID who last updated the tenant
	created_at: string; // time.Time
	updated_at: string; // time.Time
}

export interface UpdateTenantRequest {
	name?: string;
	is_active?: boolean;
}

export interface MinimalTenantInfo {
	id: string; // uuid.UUID
	name: string;
	slug: string;
	is_active: boolean;
}

export interface PaginatedTenantsResponse {
	tenants: MinimalTenantInfo[];
	total: number; // int64
	limit: number;
	offset: number;
	total_pages: number;
	has_previous: boolean;
	has_next: boolean;
}

// DTOs for Tenant-Contextual User Management

export interface AddUserToTenantRequest {
	email: string;
	role_names: string[];
}

export interface TenantUserResponse {
	user_id: string; // uuid.UUID - Global User ID
	email: string;
	first_name: string;
	last_name: string;
	avatar?: string;
	status_in_tenant: string; // e.g., "active", "invited"
	global_status: string;    // e.g., "active", "pending"
	roles: string[];          // Role names within this tenant
	joined_at: string;        // time.Time - CreatedAt from TenantUser table
}

export interface UpdateTenantUserRequest {
	role_names?: string[];
	status_in_tenant?: string; // "active" | "invited" | "suspended"
}

export interface UserTenantMembershipInfo {
	tenant_id: string; // uuid.UUID
	tenant_name: string;
	tenant_slug: string;
	tenant_is_active: boolean;
	user_roles: string[];
	user_status: string;
	joined_at: string; // time.Time
}

export interface PaginatedTenantUsersResponse {
	users: TenantUserResponse[];
	total: number; // int64
	limit: number;
	offset: number;
	total_pages: number;
	has_previous: boolean;
	has_next: boolean;
}

export interface CreateTenantRequest {
	name: string;
	slug: string;
	owner_email: string;
}



export interface UpdateTenantRequest {
	name?: string;
	is_active?: boolean;
}

export interface MinimalTenantInfo {
	id: string; // uuid.UUID
	name: string;
	slug: string;
}

export interface AddUserToTenantRequest {
	email: string;
	role_ids: string[]; // uuid.UUID array
}



export interface UpdateTenantUserRequest {
	role_ids?: string[]; // uuid.UUID array, pointer in Go means optional
	status_in_tenant?: string; // e.g., "active", "invited", "suspended"
}

// Paginated responses for Tenant resources
export interface PaginatedTenants {
	tenants: TenantResponse[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
	has_previous: boolean;
	has_next: boolean;
}

export interface PaginatedTenantUsers {
	users: TenantUserResponse[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
	has_previous: boolean;
	has_next: boolean;
}

export interface UserTenantMembershipInfo {
	tenant_id: string;
	tenant_name: string;
	tenant_slug: string;
	tenant_is_active: boolean;
	user_roles: string[];
	user_status: string;
	joined_at: string;
}