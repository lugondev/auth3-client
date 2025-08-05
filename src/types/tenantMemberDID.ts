export interface TenantMemberDIDInfo {
  did_id: string;
  did: string;
  method: string;
  status: string;
  name?: string;
  created_at: string;
  updated_at: string;
  
  // User information (member who owns this DID)
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  
  // Tenant membership information
  joined_tenant_at: string;
  user_roles: string[];
}

export interface ListTenantMemberDIDsRequest {
  tenant_id: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListTenantMemberDIDsResponse {
  tenant_id: string;
  dids: TenantMemberDIDInfo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TenantMemberDIDFilters {
  search?: string;
}
