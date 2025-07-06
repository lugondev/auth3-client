import apiClient from '@/lib/apiClient'

// Analytics interfaces
export interface PresentationAnalytics {
  overview: AnalyticsOverview
  trends: AnalyticsTrend[]
  verificationStats: VerificationStats
  sharingStats: SharingStats
  credentialTypes: CredentialTypeStats[]
  userActivity: UserActivityStats[]
  issuerStats: IssuerStats[]
  geographicStats: GeographicStats[]
}

export interface AnalyticsOverview {
  totalPresentations: number
  totalVerifications: number
  successRate: number
  averageVerificationTime: number
  uniqueUsers: number
  activePresentations: number
  trendingCredentialTypes: string[]
  lastUpdated: string
}

export interface AnalyticsTrend {
  date: string
  presentations: number
  verifications: number
  successRate: number
  uniqueUsers: number
}

export interface VerificationStats {
  total: number
  successful: number
  failed: number
  warnings: number
  averageTime: number
  byCredentialType: Record<string, number>
  byIssuer: Record<string, number>
  errorReasons: Record<string, number>
}

export interface SharingStats {
  totalShares: number
  qrCodeShares: number
  linkShares: number
  emailShares: number
  averageViews: number
  topSharedTypes: string[]
  sharesByTime: Record<string, number>
}

export interface CredentialTypeStats {
  type: string
  count: number
  verificationRate: number
  shareRate: number
  averageTrustScore: number
  trend: 'up' | 'down' | 'stable'
}

export interface UserActivityStats {
  date: string
  activeUsers: number
  newUsers: number
  presentationsCreated: number
  verificationsPerformed: number
}

export interface IssuerStats {
  issuer: string
  credentialsIssued: number
  verificationRate: number
  trustScore: number
  popularTypes: string[]
}

export interface GeographicStats {
  country: string
  region: string
  users: number
  presentations: number
  verifications: number
}

export interface PresentationStats {
  totalPresentations: number
  validPresentations: number
  invalidPresentations: number
  pendingPresentations: number
  createdToday: number
  createdThisWeek: number
  createdThisMonth: number
  generatedAt: string
}

/**
 * Service for presentation analytics operations
 */
export class PresentationAnalyticsService {
  
  /**
   * Get comprehensive analytics data
   */
  async getAnalytics(timeRange: string = '30d', filter?: string): Promise<PresentationAnalytics> {
    try {
      // Try to get comprehensive analytics from a single endpoint first
      const response = await apiClient.get<PresentationAnalytics>(
        `/api/v1/presentations/analytics?range=${timeRange}${filter ? `&filter=${filter}` : ''}`
      )
      return response.data
    } catch (error) {
      console.warn('Comprehensive analytics endpoint not available, falling back to individual endpoints')
      
      // Fallback to individual endpoints
      const [
        statsResponse,
        trendsResponse,
        verificationResponse,
        sharingResponse
      ] = await Promise.all([
        this.getBasicStats(),
        this.getTrends(timeRange).catch(() => null),
        this.getVerificationStats().catch(() => null),
        this.getSharingStats().catch(() => null)
      ])

      return this.buildAnalyticsFromParts(statsResponse, trendsResponse, verificationResponse, sharingResponse)
    }
  }

  /**
   * Get basic presentation statistics
   */
  async getBasicStats(): Promise<PresentationStats> {
    const response = await apiClient.get<PresentationStats>('/api/v1/presentations/statistics')
    return response.data
  }

  /**
   * Get analytics trends over time
   */
  async getTrends(timeRange: string): Promise<{
    trends: AnalyticsTrend[]
    userActivity: UserActivityStats[]
  }> {
    const response = await apiClient.get<{
      trends: AnalyticsTrend[]
      userActivity: UserActivityStats[]
    }>(`/api/v1/presentations/trends?range=${timeRange}`)
    return response.data
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<VerificationStats> {
    const response = await apiClient.get<VerificationStats>('/api/v1/presentations/verification-stats')
    return response.data
  }

  /**
   * Get sharing statistics
   */
  async getSharingStats(): Promise<SharingStats> {
    const response = await apiClient.get<SharingStats>('/api/v1/presentations/sharing-stats')
    return response.data
  }

  /**
   * Get credential type analytics
   */
  async getCredentialTypeStats(): Promise<CredentialTypeStats[]> {
    const response = await apiClient.get<CredentialTypeStats[]>('/api/v1/presentations/credential-types')
    return response.data
  }

  /**
   * Get issuer statistics
   */
  async getIssuerStats(): Promise<IssuerStats[]> {
    const response = await apiClient.get<IssuerStats[]>('/api/v1/presentations/issuer-stats')
    return response.data
  }

  /**
   * Get geographic distribution
   */
  async getGeographicStats(): Promise<GeographicStats[]> {
    const response = await apiClient.get<GeographicStats[]>('/api/v1/presentations/geographic-stats')
    return response.data
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(timeRange: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await apiClient.get(
      `/api/v1/presentations/analytics/export?range=${timeRange}&format=${format}`,
      { responseType: 'blob' }
    )
    return response.data as Blob
  }

  /**
   * Build analytics from individual parts when comprehensive endpoint is not available
   */
  private buildAnalyticsFromParts(
    stats: PresentationStats,
    trends: { trends: AnalyticsTrend[], userActivity: UserActivityStats[] } | null,
    verification: VerificationStats | null,
    sharing: SharingStats | null
  ): PresentationAnalytics {
    return {
      overview: {
        totalPresentations: stats.totalPresentations || 0,
        totalVerifications: (stats.validPresentations || 0) + (stats.invalidPresentations || 0),
        successRate: stats.validPresentations && stats.totalPresentations 
          ? ((stats.validPresentations || 0) / (stats.totalPresentations || 1)) * 100 
          : 0,
        averageVerificationTime: verification?.averageTime || 0,
        uniqueUsers: Math.floor((stats.totalPresentations || 0) * 0.7), // Estimate
        activePresentations: (stats.totalPresentations || 0) - (stats.invalidPresentations || 0),
        trendingCredentialTypes: Object.keys(verification?.byCredentialType || {}).slice(0, 3),
        lastUpdated: new Date().toISOString()
      },
      trends: trends?.trends || [],
      verificationStats: verification || {
        total: (stats.validPresentations || 0) + (stats.invalidPresentations || 0),
        successful: stats.validPresentations || 0,
        failed: stats.invalidPresentations || 0,
        warnings: 0,
        averageTime: 0,
        byCredentialType: {},
        byIssuer: {},
        errorReasons: {}
      },
      sharingStats: sharing || {
        totalShares: 0,
        qrCodeShares: 0,
        linkShares: 0,
        emailShares: 0,
        averageViews: 0,
        topSharedTypes: [],
        sharesByTime: {}
      },
      credentialTypes: [],
      userActivity: trends?.userActivity || [],
      issuerStats: [],
      geographicStats: []
    }
  }
}

// Create and export service instance
export const presentationAnalyticsService = new PresentationAnalyticsService()
export default presentationAnalyticsService
