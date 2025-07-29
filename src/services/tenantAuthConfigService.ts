import apiClient from '@/lib/apiClient'
import {
  TenantAuthConfig,
  CreateTenantAuthConfigInput,
  UpdateTenantAuthConfigInput,
  SSOConfig,
  MFAPolicy,
  UpdateSSOConfigInput,
  SSOConfigResponse,
  MFAPolicyResponse,
  AutoJoinSettingsResponse
} from '@/types/tenant-auth'

export class TenantAuthConfigService {
  private readonly baseUrl = '/api/v1/tenants'

  /**
   * Get tenant authentication configuration
   */
  async getTenantAuthConfig(tenantId: string): Promise<TenantAuthConfig> {
    const response = await apiClient.get<TenantAuthConfig>(`${this.baseUrl}/${tenantId}/auth-config`)
    return response.data
  }

  /**
   * Create tenant authentication configuration
   */
  async createTenantAuthConfig(input: CreateTenantAuthConfigInput): Promise<TenantAuthConfig> {
    const response = await apiClient.post<TenantAuthConfig>(`${this.baseUrl}/${input.tenant_id}/auth-config`, input)
    return response.data
  }

  /**
   * Update tenant authentication configuration
   */
  async updateTenantAuthConfig(tenantId: string, input: UpdateTenantAuthConfigInput): Promise<TenantAuthConfig> {
    const response = await apiClient.put<TenantAuthConfig>(`${this.baseUrl}/${tenantId}/auth-config`, input)
    return response.data
  }

  /**
   * Delete tenant authentication configuration
   */
  async deleteTenantAuthConfig(tenantId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${tenantId}/auth-config`)
  }

  // SSO Configuration Methods

  /**
   * Get SSO configuration for a tenant
   */
  async getSSOConfig(tenantId: string): Promise<SSOConfigResponse> {
    const response = await apiClient.get<SSOConfigResponse>(`${this.baseUrl}/${tenantId}/auth-config/sso`)
    return response.data
  }

  /**
   * Update SSO configuration for a tenant
   */
  async updateSSOConfig(tenantId: string, input: UpdateSSOConfigInput): Promise<SSOConfigResponse> {
    const response = await apiClient.put<SSOConfigResponse>(`${this.baseUrl}/${tenantId}/auth-config/sso`, input)
    return response.data
  }

  /**
   * Enable/disable SSO for a tenant
   */
  async toggleSSO(tenantId: string, enabled: boolean): Promise<SSOConfigResponse> {
    return this.updateSSOConfig(tenantId, { enable_sso: enabled })
  }

  /**
   * Update SSO providers configuration
   */
  async updateSSOProviders(tenantId: string, ssoConfig: SSOConfig): Promise<SSOConfigResponse> {
    return this.updateSSOConfig(tenantId, { sso_config: ssoConfig })
  }

  // MFA Policy Methods

  /**
   * Get MFA policy for a tenant
   */
  async getMFAPolicy(tenantId: string): Promise<MFAPolicyResponse> {
    const response = await apiClient.get<MFAPolicyResponse>(`${this.baseUrl}/${tenantId}/auth-config/mfa`)
    return response.data
  }

  /**
   * Update MFA policy for a tenant
   */
  async updateMFAPolicy(tenantId: string, policy: MFAPolicy): Promise<MFAPolicyResponse> {
    const response = await apiClient.put<MFAPolicyResponse>(`${this.baseUrl}/${tenantId}/auth-config/mfa`, {
      mfa_policy: policy
    })
    return response.data
  }

  // Auto-Join Settings Methods

  /**
   * Get auto-join settings for a tenant
   */
  async getAutoJoinSettings(tenantId: string): Promise<AutoJoinSettingsResponse> {
    const response = await apiClient.get<AutoJoinSettingsResponse>(`${this.baseUrl}/${tenantId}/auth-config/auto-join`)
    return response.data
  }

  /**
   * Update auto-join settings for a tenant
   */
  async updateAutoJoinSettings(tenantId: string, allowAutoJoin: boolean): Promise<AutoJoinSettingsResponse> {
    const response = await apiClient.put<AutoJoinSettingsResponse>(`${this.baseUrl}/${tenantId}/auth-config/auto-join`, {
      allow_auto_join: allowAutoJoin
    })
    return response.data
  }

  /**
   * Toggle auto-join setting for a tenant
   */
  async toggleAutoJoin(tenantId: string, enabled: boolean): Promise<AutoJoinSettingsResponse> {
    return this.updateAutoJoinSettings(tenantId, enabled)
  }

  // Validation Methods

  /**
   * Validate tenant auth configuration
   */
  async validateAuthConfig(tenantId: string): Promise<{ valid: boolean; errors?: string[] }> {
    const response = await apiClient.post<{ valid: boolean; errors?: string[] }>(
      `${this.baseUrl}/${tenantId}/auth-config/validate`
    )
    return response.data
  }

  /**
   * Test SSO provider connection
   */
  async testSSOProvider(tenantId: string, providerId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${tenantId}/auth-config/sso/providers/${providerId}/test`
    )
    return response.data
  }

  // Bulk Operations

  /**
   * Get multiple tenant auth configurations
   */
  async getBulkTenantAuthConfigs(tenantIds: string[]): Promise<TenantAuthConfig[]> {
    const response = await apiClient.post<TenantAuthConfig[]>(`${this.baseUrl}/auth-config/bulk`, {
      tenant_ids: tenantIds
    })
    return response.data
  }

  /**
   * Bulk update tenant auth configurations
   */
  async bulkUpdateTenantAuthConfigs(
    updates: Array<{ tenant_id: string; config: UpdateTenantAuthConfigInput }>
  ): Promise<TenantAuthConfig[]> {
    const response = await apiClient.put<TenantAuthConfig[]>(`${this.baseUrl}/auth-config/bulk`, {
      updates
    })
    return response.data
  }

  // Analytics Methods

  /**
   * Get auth configuration analytics for a tenant
   */
  async getAuthConfigAnalytics(tenantId: string, dateRange?: { start: string; end: string }) {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : ''
    const response = await apiClient.get(`${this.baseUrl}/${tenantId}/auth-config/analytics${params}`)
    return response.data
  }

  /**
   * Get SSO usage statistics
   */
  async getSSOUsageStats(tenantId: string, dateRange?: { start: string; end: string }) {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : ''
    const response = await apiClient.get(`${this.baseUrl}/${tenantId}/auth-config/sso/stats${params}`)
    return response.data
  }

  /**
   * Get MFA usage statistics
   */
  async getMFAUsageStats(tenantId: string, dateRange?: { start: string; end: string }) {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : ''
    const response = await apiClient.get(`${this.baseUrl}/${tenantId}/auth-config/mfa/stats${params}`)
    return response.data
  }
}

// Export singleton instance
export const tenantAuthConfigService = new TenantAuthConfigService()
export default tenantAuthConfigService
