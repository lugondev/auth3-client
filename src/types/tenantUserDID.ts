export interface TenantUserDIDInfo {
	did_id: string;
	did: string;
	method: string;
	status: string;
	ownership_type: string;
	name?: string;
	created_at: string;
	updated_at: string;
	
	// Tenant-specific information (if applicable)
	tenant_did_id?: string;
	access_level?: string;
	tenant_capabilities?: any;
	description?: string;
	last_used_at?: string;
	usage_count?: number;
}

export interface ListUserDIDsInTenantResponse {
	user_id: string;
	tenant_id: string;
	dids: TenantUserDIDInfo[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}
