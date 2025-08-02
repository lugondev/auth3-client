export interface TenantProfile {
  id: string;
  tenant_id: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  founded_year?: number;
  tax_id?: string;
  business_license?: string;
  social_links?: { [key: string]: string };
  is_verified: boolean;
  is_trusted: boolean;
  verification_date?: string;
  created_by?: string;
  updated_by?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface TenantProfilePublic {
  tenant_id: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  founded_year?: number;
  social_links?: { [key: string]: string };
  is_verified: boolean;
  is_trusted: boolean;
  created_at: string;
}

export interface CreateTenantProfileRequest {
  display_name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  founded_year?: number;
  tax_id?: string;
  business_license?: string;
  social_links?: { [key: string]: string };
}

export interface UpdateTenantProfileRequest extends CreateTenantProfileRequest {}

export interface TenantProfileStats {
  total_profiles: number;
  verified_profiles: number;
  trusted_profiles: number;
  public_profiles: number;
}

export interface PublicProfilesListResponse {
  profiles: TenantProfilePublic[];
  total: number;
  limit: number;
  offset: number;
}

export interface VerificationStatusResponse {
  tenant_id: string;
  is_verified: boolean;
  is_trusted: boolean;
  verification_date?: string;
}
