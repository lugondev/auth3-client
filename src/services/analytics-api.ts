import axios from 'axios'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/analytics`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Common time range interface
export interface TimeRangeRequest {
  start_time?: string
  end_time?: string
}

// Error response interface
export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: Record<string, unknown>
}

// Authentication Analytics Service
export class AuthAnalyticsService {
  static async getLoginAnalytics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/auth/logins', { params })
    return response.data
  }

  static async getRecentLogins(params?: TimeRangeRequest) {
    const response = await apiClient.get('/auth/recent-logins', { params })
    return response.data
  }

  static async getAuthDashboard(params?: TimeRangeRequest) {
    const response = await apiClient.get('/auth/dashboard', { params })
    return response.data
  }
}

// OAuth2 Analytics Service
export class OAuth2AnalyticsService {
  static async getOAuth2FlowAnalytics(params?: {
    client_id?: string
    grant_type?: string
    include_errors?: boolean
  } & TimeRangeRequest) {
    const response = await apiClient.get('/oauth2/flows', { params })
    return response.data
  }

  static async getClientAnalytics(params?: {
    client_id?: string
  } & TimeRangeRequest) {
    const response = await apiClient.get('/oauth2/client', { params })
    return response.data
  }

  static async getErrorAnalytics(params?: {
    error_type?: string
  } & TimeRangeRequest) {
    const response = await apiClient.get('/oauth2/errors', { params })
    return response.data
  }

  static async getRealTimeMetrics() {
    const response = await apiClient.get('/oauth2/realtime')
    return response.data
  }

  static async getOAuth2Dashboard(params?: TimeRangeRequest) {
    const response = await apiClient.get('/oauth2/dashboard', { params })
    return response.data
  }
}

// DID Analytics Service
export class DIDAnalyticsService {
  static async getDIDCreationAnalytics(params?: {
    did_method?: string
    status?: string
  } & TimeRangeRequest) {
    const response = await apiClient.get('/did/creation', { params })
    return response.data
  }

  static async getDIDResolutionAnalytics(params?: {
    did_method?: string
    resolution_type?: string
  } & TimeRangeRequest) {
    const response = await apiClient.get('/did/resolution', { params })
    return response.data
  }

  static async getDIDMethodAnalytics(params?: {
    method?: string
  } & TimeRangeRequest) {
    const response = await apiClient.get('/did/methods', { params })
    return response.data
  }

  static async getDIDSecurityAnalytics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/did/security', { params })
    return response.data
  }

  static async getDIDVerificationAnalytics(params?: {
    verification_type?: string
  } & TimeRangeRequest) {
    const response = await apiClient.get('/did/verification', { params })
    return response.data
  }

  static async getDIDPerformanceMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/did/performance', { params })
    return response.data
  }

  static async getDIDDashboard(params?: TimeRangeRequest) {
    const response = await apiClient.get('/did/dashboard', { params })
    return response.data
  }
}

// KMS Analytics Service
export class KMSAnalyticsService {
  static async getKMSKeyManagementMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/kms/key-management', { params })
    return response.data
  }

  static async getKMSCryptographicMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/kms/cryptographic', { params })
    return response.data
  }

  static async getKMSSecurityMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/kms/security', { params })
    return response.data
  }

  static async getKMSPerformanceMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/kms/performance', { params })
    return response.data
  }

  static async getKMSComplianceMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/kms/compliance', { params })
    return response.data
  }

  static async getKMSDashboard(params?: TimeRangeRequest) {
    const response = await apiClient.get('/kms/dashboard', { params })
    return response.data
  }

  static async getRealTimeKMSMetrics() {
    const response = await apiClient.get('/kms/realtime')
    return response.data
  }
}

// Tenant Analytics Service
export class TenantAnalyticsService {
  static async getTenantUsageMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/tenant/usage', { params })
    return response.data
  }

  static async getTenantBillingMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/tenant/billing', { params })
    return response.data
  }

  static async getTenantGrowthMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/tenant/growth', { params })
    return response.data
  }

  static async getTenantSecurityMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/tenant/security', { params })
    return response.data
  }

  static async getTenantPerformanceMetrics(params?: TimeRangeRequest) {
    const response = await apiClient.get('/tenant/performance', { params })
    return response.data
  }

  static async getTenantDashboard(params?: TimeRangeRequest) {
    const response = await apiClient.get('/tenant/dashboard', { params })
    return response.data
  }

  static async getRealTimeTenantMetrics() {
    const response = await apiClient.get('/tenant/realtime')
    return response.data
  }
}

// System Analytics Service
export class SystemAnalyticsService {
  static async getSystemHealth() {
    const response = await apiClient.get('/system/health')
    return response.data
  }

  static async recordMetric(metric: {
    name: string
    value: number
    labels?: Record<string, string>
    timestamp?: string
  }) {
    const response = await apiClient.post('/system/metrics', metric)
    return response.data
  }

  static async getSystemEvents(params?: {
    event_type?: string
    level?: string
  } & TimeRangeRequest) {
    const response = await apiClient.get('/system/events', { params })
    return response.data
  }
}

// Common utility functions
export const formatTimeRange = (days: number): TimeRangeRequest => {
  const end_time = new Date().toISOString()
  const start_time = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  return { start_time, end_time }
}

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const errorResponse = error.response?.data as ErrorResponse
    return errorResponse?.message || error.message || 'An error occurred'
  }
  return 'An unexpected error occurred'
}

// Export default analytics service aggregator
export const AnalyticsAPI = {
  auth: AuthAnalyticsService,
  oauth2: OAuth2AnalyticsService,
  did: DIDAnalyticsService,
  kms: KMSAnalyticsService,
  tenant: TenantAnalyticsService,
  system: SystemAnalyticsService,
}
