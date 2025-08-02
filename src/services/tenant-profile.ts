import apiClient from '@/lib/apiClient';
import {
  TenantProfile,
  TenantProfilePublic,
  CreateTenantProfileRequest,
  UpdateTenantProfileRequest,
  TenantProfileStats,
  PublicProfilesListResponse,
  VerificationStatusResponse
} from '@/types/tenant-profile';

// API Response wrapper interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const tenantProfileApi = {
  // Profile CRUD operations
  async createProfile(tenantId: string, data: CreateTenantProfileRequest): Promise<TenantProfile> {
    const response = await apiClient.post<ApiResponse<TenantProfile>>(`/api/v1/tenants/${tenantId}/profile`, data);
    return response.data.data;
  },

  async getProfile(tenantId: string): Promise<TenantProfile> {
    const response = await apiClient.get<TenantProfile>(`/api/v1/tenants/${tenantId}/profile`);
    return response.data;
  },

  async updateProfile(tenantId: string, data: UpdateTenantProfileRequest): Promise<TenantProfile> {
    const response = await apiClient.put<TenantProfile>(`/api/v1/tenants/${tenantId}/profile`, data);
    return response.data;
  },

  async deleteProfile(tenantId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tenants/${tenantId}/profile`);
  },

  // Verification operations
  async requestVerification(tenantId: string): Promise<void> {
    await apiClient.post(`/api/v1/tenants/${tenantId}/profile/verify`);
  },

  async approveVerification(tenantId: string): Promise<void> {
    await apiClient.post(`/api/v1/tenants/${tenantId}/profile/approve`);
  },

  async rejectVerification(tenantId: string): Promise<void> {
    await apiClient.post(`/api/v1/tenants/${tenantId}/profile/reject`);
  },

  // Trust operations
  async markAsTrusted(tenantId: string): Promise<void> {
    await apiClient.post(`/api/v1/tenants/${tenantId}/profile/trust`);
  },

  async removeTrustedStatus(tenantId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tenants/${tenantId}/profile/trust`);
  },

  // Public operations
  async getPublicProfile(tenantId: string): Promise<TenantProfilePublic> {
    const response = await apiClient.get<TenantProfilePublic>(`/public/tenants/${tenantId}/profile`);
    return response.data;
  },

  async listPublicProfiles(params?: {
    limit?: number;
    offset?: number;
    industry?: string;
    verified_only?: boolean;
    trusted_only?: boolean;
  }): Promise<PublicProfilesListResponse> {
    const response = await apiClient.get<PublicProfilesListResponse>('/public/tenants/profiles', { params });
    return response.data;
  },

  async getVerificationStatus(tenantId: string): Promise<VerificationStatusResponse> {
    const response = await apiClient.get<VerificationStatusResponse>(`/public/tenants/${tenantId}/verification`);
    return response.data;
  },

  // Statistics
  async getProfileStats(): Promise<TenantProfileStats> {
    const response = await apiClient.get<TenantProfileStats>('/tenants/profile/stats');
    return response.data;
  }
};
