export interface SocialProfile {
	provider: string;
	provider_id: string;
	email: string;
	display_name: string;
}

export interface TenantOwner {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	is_email_verified: boolean;
	email_verified_at: string | null; // ISO date string
	is_phone_verified: boolean;
	phone_verified_at: string | null; // ISO date string
	is_two_factor_enabled: boolean;
	roles: string[];
	status: string; // Consider an enum: 'active', 'inactive', 'pending_verification'
	created_at: string; // ISO date string
	updated_at: string; // ISO date string
	social_profiles?: SocialProfile[];
}

export interface Tenant {
	id: string;
	name: string;
	slug: string;
	is_active: boolean;
	owner_user_id?: string; // Added from provided data
	created_at?: string; // Added from provided data, ISO date string
	updated_at?: string; // Added from provided data, ISO date string
	owner?: TenantOwner; // Added owner information
}

export interface JoinedTenantMembership {
	tenant_id: string;
	tenant_name: string;
	tenant_slug: string;
	tenant_is_active: boolean;
	user_roles: string[];
	user_status: string; // Consider using an enum: 'active', 'suspended', 'invited', etc.
	joined_at: string; // ISO date string
}

export interface PaginatedResponse<T> {
	total: number;
	limit: number;
	offset: number;
	total_pages: number;
	memberships?: T[]; // For joined tenants
	tenants?: T[];     // For owned and all tenants
}

export type JoinedTenantsResponse = PaginatedResponse<JoinedTenantMembership>;
export type OwnedTenantsResponse = PaginatedResponse<Tenant>;
export type AllTenantsResponse = PaginatedResponse<Tenant>;

export interface CreateTenantPayload {
	name: string;
	slug: string;
}

// Assuming the response for creating a tenant is the tenant object itself
export type CreateTenantResponse = Tenant;
