// Types for tenant auth configuration based on the updated backend
export enum MFAPolicy {
  Disabled = 'disabled',
  OptionalForAll = 'optional_for_all', 
  MandatoryForAdmins = 'mandatory_for_admins',
  MandatoryForAll = 'mandatory_for_all'
}

export interface SSOProvider {
  id: string
  name: string
  type: string
  enabled: boolean
  client_id: string
  client_secret: string
  auth_url: string
  token_url: string
  user_info_url: string
  scopes?: string[]
}

export interface SSOConfig {
  providers?: SSOProvider[]
  default_provider?: string
  force_redirect?: boolean
}

export interface TenantAuthConfig {
  id?: string
  tenant_id: string;
  enable_sso: boolean;
  sso_config?: SSOConfig;
  mfa_policy: MFAPolicy;
  allow_auto_join: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantAuthConfigInput {
  tenant_id: string
  enable_sso?: boolean
  sso_config?: SSOConfig
  mfa_policy?: MFAPolicy
  allow_auto_join?: boolean
}

export interface UpdateTenantAuthConfigInput {
  enable_sso?: boolean;
  sso_config?: SSOConfig;
  mfa_policy?: MFAPolicy;
  allow_auto_join?: boolean;
}

export interface SSOConfigResponse {
  tenant_id: string;
  enable_sso: boolean;
  sso_config: SSOConfig;
  updated_at: string;
}

export interface UpdateSSOConfigInput {
  enable_sso?: boolean;
  sso_config?: SSOConfig;
}

export interface MFAPolicyResponse {
  tenant_id: string;
  mfa_policy: string;
  updated_at: string;
}

export interface AutoJoinSettingsResponse {
  tenant_id: string;
  allow_auto_join: boolean;
  updated_at: string;
}
