import apiClient from '@/lib/apiClient'
import { withErrorHandling, handleApiError } from './errorHandlingService'
import type {
  SystemDashboardAnalytics,
  PersonalDashboardAnalytics,
  AuthDashboardResponse,
  DIDDashboardResponse,
  KMSDashboardResponse,
  OAuth2DashboardResponse,
  SystemHealthResponse,
  SystemEventsResponse,
  LoginActivityItem,
  SecurityEventItem,
  DeviceStatsItem,
  LocationStatsItem,
  UserGrowthItem,
  TenantStatsItem,
  TimeRangeRequest,
  PaginatedRequest,
  DIDCreationMetricsResponse,
  DIDMethodMetricsResponse,
  DIDResolutionMetricsResponse,
  DIDPerformanceMetricsResponse,
  DIDSecurityMetricsResponse,
  DIDVerificationMetricsResponse,
  KMSKeyManagementMetricsResponse,
  KMSCryptographicMetricsResponse,
  KMSSecurityMetricsResponse,
  KMSPerformanceMetricsResponse,
  KMSComplianceMetricsResponse,
  KMSRealTimeMetricsResponse,
  OAuth2ErrorAnalyticsResponse,
  OAuth2FlowAnalyticsResponse,
  ClientAnalyticsResponse,
  RealTimeOAuth2Response,
  LoginAnalyticsResponse,
  RecentLoginsResponse
} from '@/types/analytics'

// Error response interface
export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: Record<string, unknown>
}

// ============= System Analytics Service =============

export class SystemAnalyticsService {
  static getSystemDashboard = withErrorHandling(async (params?: TimeRangeRequest): Promise<SystemDashboardAnalytics> => {
    const response = await apiClient.get('/api/v1/analytics/admin/system', { params })
    return response.data as SystemDashboardAnalytics
  })

  static getSystemHealth = withErrorHandling(async (): Promise<SystemHealthResponse> => {
    const response = await apiClient.get('/api/v1/analytics/system/health')
    return response.data as SystemHealthResponse
  })

  static getSystemEvents = withErrorHandling(async (params?: {
    event_type?: string
    level?: string
  } & TimeRangeRequest & PaginatedRequest): Promise<SystemEventsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/system/events', { params })
    return response.data as SystemEventsResponse
  })

  static getLoginActivity = withErrorHandling(async (params?: {
    start_date?: string
    end_date?: string
    interval?: string
  }): Promise<LoginActivityItem[]> => {
    const response = await apiClient.get('/api/v1/analytics/admin/login-activity', { params })
    return response.data as LoginActivityItem[]
  })

  static getSecurityEvents = withErrorHandling(async (params?: {
    user_id?: string
  } & PaginatedRequest): Promise<SecurityEventItem[]> => {
    const response = await apiClient.get('/api/v1/analytics/admin/security-events', { params })
    return response.data as SecurityEventItem[]
  })

  static getTenantStats = withErrorHandling(async (params?: PaginatedRequest): Promise<TenantStatsItem[]> => {
    const response = await apiClient.get('/api/v1/analytics/admin/tenant-stats', { params })
    return response.data as TenantStatsItem[]
  })

  static getTopDevices = withErrorHandling(async (params?: {
    start_date?: string
    end_date?: string
    limit?: number
  }): Promise<DeviceStatsItem[]> => {
    const response = await apiClient.get('/api/v1/analytics/admin/top-devices', { params })
    return response.data as DeviceStatsItem[]
  })

  static getTopLocations = withErrorHandling(async (params?: {
    start_date?: string
    end_date?: string
    limit?: number
  }): Promise<LocationStatsItem[]> => {
    const response = await apiClient.get('/api/v1/analytics/admin/top-locations', { params })
    return response.data as LocationStatsItem[]
  })

  static getUserGrowth = withErrorHandling(async (params?: {
    start_date?: string
    end_date?: string
    interval?: string
  }): Promise<UserGrowthItem[]> => {
    const response = await apiClient.get('/api/v1/analytics/admin/user-growth', { params })
    return response.data as UserGrowthItem[]
  })

  static recordMetric = withErrorHandling(async (metric: {
    name: string
    value: number
    labels?: Record<string, string>
    timestamp?: string
  }) => {
    const response = await apiClient.post('/api/v1/analytics/system/metrics', metric)
    return response.data
  })
}

// ============= Personal Analytics Service =============

export class PersonalAnalyticsService {
  static getPersonalDashboard = withErrorHandling(async (params?: TimeRangeRequest): Promise<PersonalDashboardAnalytics> => {
    const response = await apiClient.get('/api/v1/analytics/dashboard', { params })
    return response.data as PersonalDashboardAnalytics
  })
}

// ============= Authentication Analytics Service =============

export class AuthAnalyticsService {
  static getAuthDashboard = withErrorHandling(async (params?: TimeRangeRequest): Promise<AuthDashboardResponse> => {
    const response = await apiClient.get('/api/v1/analytics/auth/dashboard', { params })
    return response.data as AuthDashboardResponse
  })

  static getLoginAnalytics = withErrorHandling(async (params?: TimeRangeRequest): Promise<LoginAnalyticsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/auth/logins', { params })
    return response.data as LoginAnalyticsResponse
  })

  static getRecentLogins = withErrorHandling(async (params?: { hours?: number }): Promise<RecentLoginsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/auth/recent-logins', { params })
    return response.data as RecentLoginsResponse
  })
}

// ============= DID Analytics Service =============

export class DIDAnalyticsService {
  static getDIDDashboard = withErrorHandling(async (params?: TimeRangeRequest): Promise<DIDDashboardResponse> => {
    const response = await apiClient.get('/api/v1/analytics/did/dashboard', { params })
    return response.data as DIDDashboardResponse
  })

  static getDIDCreationAnalytics = withErrorHandling(async (params?: {
    did_method?: string
    status?: string
  } & TimeRangeRequest): Promise<DIDCreationMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/did/creation', { params })
    return response.data as DIDCreationMetricsResponse
  })

  static getDIDMethodAnalytics = withErrorHandling(async (params?: {
    did_method?: string
  } & TimeRangeRequest): Promise<DIDMethodMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/did/methods', { params })
    return response.data as DIDMethodMetricsResponse
  })

  static getDIDResolutionAnalytics = withErrorHandling(async (params?: {
    did_method?: string
    status?: string
  } & TimeRangeRequest): Promise<DIDResolutionMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/did/resolution', { params })
    return response.data as DIDResolutionMetricsResponse
  })

  static getDIDPerformanceMetrics = withErrorHandling(async (params?: TimeRangeRequest): Promise<DIDPerformanceMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/did/performance', { params })
    return response.data as DIDPerformanceMetricsResponse
  })

  static getDIDSecurityAnalytics = withErrorHandling(async (params?: TimeRangeRequest): Promise<DIDSecurityMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/did/security', { params })
    return response.data as DIDSecurityMetricsResponse
  })

  static getDIDVerificationAnalytics = withErrorHandling(async (params?: TimeRangeRequest): Promise<DIDVerificationMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/did/verification', { params })
    return response.data as DIDVerificationMetricsResponse
  })
}

// ============= KMS Analytics Service =============

export class KMSAnalyticsService {
  static getKMSDashboard = withErrorHandling(async (params?: TimeRangeRequest): Promise<KMSDashboardResponse> => {
    const response = await apiClient.get('/api/v1/analytics/kms/dashboard', { params })
    return response.data as KMSDashboardResponse
  })

  static getKMSKeyManagementMetrics = withErrorHandling(async (params?: TimeRangeRequest): Promise<KMSKeyManagementMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/kms/key-management', { params })
    return response.data as KMSKeyManagementMetricsResponse
  })

  static getKMSCryptographicMetrics = withErrorHandling(async (params?: TimeRangeRequest): Promise<KMSCryptographicMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/kms/cryptographic', { params })
    return response.data as KMSCryptographicMetricsResponse
  })

  static getKMSSecurityMetrics = withErrorHandling(async (params?: TimeRangeRequest): Promise<KMSSecurityMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/kms/security', { params })
    return response.data as KMSSecurityMetricsResponse
  })

  static getKMSPerformanceMetrics = withErrorHandling(async (params?: TimeRangeRequest): Promise<KMSPerformanceMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/kms/performance', { params })
    return response.data as KMSPerformanceMetricsResponse
  })

  static getKMSComplianceMetrics = withErrorHandling(async (params?: TimeRangeRequest): Promise<KMSComplianceMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/kms/compliance', { params })
    return response.data as KMSComplianceMetricsResponse
  })

  static getRealTimeKMSMetrics = withErrorHandling(async (): Promise<KMSRealTimeMetricsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/kms/realtime')
    return response.data as KMSRealTimeMetricsResponse
  })
}

// ============= OAuth2 Analytics Service =============

export class OAuth2AnalyticsService {
  static getOAuth2Dashboard = withErrorHandling(async (params?: TimeRangeRequest): Promise<OAuth2DashboardResponse> => {
    const response = await apiClient.get('/api/v1/analytics/oauth2/dashboard', { params })
    return response.data as OAuth2DashboardResponse
  })

  static getOAuth2FlowAnalytics = withErrorHandling(async (params?: {
    client_id?: string
    grant_type?: string
    include_errors?: boolean
  } & TimeRangeRequest): Promise<OAuth2FlowAnalyticsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/oauth2/flows', { params })
    return response.data as OAuth2FlowAnalyticsResponse
  })

  static getClientAnalytics = withErrorHandling(async (params?: {
    client_id?: string
  } & TimeRangeRequest): Promise<ClientAnalyticsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/oauth2/client', { params })
    return response.data as ClientAnalyticsResponse
  })

  static getErrorAnalytics = withErrorHandling(async (params?: {
    error_type?: string
  } & TimeRangeRequest): Promise<OAuth2ErrorAnalyticsResponse> => {
    const response = await apiClient.get('/api/v1/analytics/oauth2/errors', { params })
    return response.data as OAuth2ErrorAnalyticsResponse
  })

  static getRealTimeMetrics = withErrorHandling(async (): Promise<RealTimeOAuth2Response> => {
    const response = await apiClient.get('/api/v1/analytics/oauth2/realtime')
    return response.data as RealTimeOAuth2Response
  })
}

// ============= Common utility functions =============

export const formatTimeRange = (days: number): TimeRangeRequest => {
  const end_time = new Date().toISOString()
  const start_time = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  return { start_time, end_time }
}

// Export default analytics service aggregator
export const AnalyticsAPI = {
  system: SystemAnalyticsService,
  personal: PersonalAnalyticsService,
  auth: AuthAnalyticsService,
  did: DIDAnalyticsService,
  kms: KMSAnalyticsService,
  oauth2: OAuth2AnalyticsService,
}

// Re-export error handling function for backward compatibility
export { handleApiError }
