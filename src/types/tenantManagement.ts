export interface Tenant {
	id: string;
	name: string;
	slug: string;
	is_active: boolean;
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
	owner_email: string;
	slug: string;
}

// Assuming the response for creating a tenant is the tenant object itself
export type CreateTenantResponse = Tenant;
