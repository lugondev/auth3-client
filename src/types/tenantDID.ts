export interface TenantDIDWithUserInfo {
  did_id: string;
  did: string;
  method: string;
  status: string;
  ownership_type: string;
  name?: string;
  created_at: string;
  updated_at: string;
  
  // User information
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  
  // Tenant-specific information (if DID is tenant-owned)
  tenant_did_id?: string;
  access_level?: string;
  tenant_capabilities?: any;
  description?: string;
  last_used_at?: string;
  usage_count?: number;
}

export interface ListTenantDIDsRequest {
  tenant_id: string;
  method?: string;
  status?: string;
  ownership_type?: string;
  limit?: number;
  offset?: number;
}

export interface ListTenantDIDsResponse {
  tenant_id: string;
  dids: TenantDIDWithUserInfo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TenantDIDFilters {
  method?: string;
  status?: string;
  ownershipType?: string;
  search?: string;
}
