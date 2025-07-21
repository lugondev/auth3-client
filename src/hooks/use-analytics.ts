import { useState, useEffect, useCallback } from 'react'
import { AnalyticsAPI, handleApiError, formatTimeRange } from '@/services/analyticsService'

interface UseAnalyticsOptions {
  refreshInterval?: number // in milliseconds
  enabled?: boolean
  timeRange?: number // in days
}

// Generic analytics hook
export function useAnalytics<T>(
  apiCall: () => Promise<T>,
  options: UseAnalyticsOptions = {}
) {
  const { refreshInterval = 30000, enabled = true, timeRange } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
      setLastRefresh(new Date())
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [apiCall, enabled])

  useEffect(() => {
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval, timeRange])

  return {
    data,
    loading,
    error,
    lastRefresh,
    refetch: fetchData,
  }
}

// Specific analytics hooks
export function useAuthAnalytics(timeRange?: number) {
  const params = timeRange ? formatTimeRange(timeRange) : undefined

  return useAnalytics(() => AnalyticsAPI.auth.getAuthDashboard(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

export function useOAuth2Analytics(timeRange?: number) {
  const params = timeRange ? formatTimeRange(timeRange) : undefined

  return useAnalytics(() => AnalyticsAPI.oauth2.getOAuth2Dashboard(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

export function useDIDAnalytics(timeRange?: number) {
  const params = timeRange ? formatTimeRange(timeRange) : undefined

  return useAnalytics(() => AnalyticsAPI.did.getDIDDashboard(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

export function useKMSAnalytics(timeRange?: number) {
  const params = timeRange ? formatTimeRange(timeRange) : undefined

  return useAnalytics(() => AnalyticsAPI.kms.getKMSDashboard(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

export function useTenantAnalytics(timeRange?: number) {
  const params = timeRange ? formatTimeRange(timeRange) : undefined

  // TODO: Implement proper tenant analytics API
  return useAnalytics(() => AnalyticsAPI.system.getSystemDashboard(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

export function useSystemHealth() {
  return useAnalytics(() => AnalyticsAPI.system.getSystemHealth(), {
    refreshInterval: 10000, // More frequent for system health
  })
}

// Real-time analytics hooks
export function useOAuth2RealTime() {
  return useAnalytics(() => AnalyticsAPI.oauth2.getRealTimeMetrics(), {
    refreshInterval: 5000, // Very frequent for real-time
  })
}

export function useKMSRealTime() {
  return useAnalytics(() => AnalyticsAPI.kms.getRealTimeKMSMetrics(), {
    refreshInterval: 5000,
  })
}

export function useTenantRealTime() {
  // TODO: Implement proper real-time tenant metrics API
  return useAnalytics(() => AnalyticsAPI.system.getSystemDashboard(), {
    refreshInterval: 5000,
  })
}

// Login analytics hook
export function useLoginAnalytics(timeRange?: number) {
  const params = timeRange ? formatTimeRange(timeRange) : undefined

  return useAnalytics(() => AnalyticsAPI.auth.getLoginAnalytics(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

// OAuth2 flow analytics with filters
export function useOAuth2FlowAnalytics(
  timeRange?: number,
  filters?: {
    client_id?: string
    grant_type?: string
    include_errors?: boolean
  }
) {
  const params = {
    ...(timeRange ? formatTimeRange(timeRange) : {}),
    ...filters,
  }

  return useAnalytics(() => AnalyticsAPI.oauth2.getOAuth2FlowAnalytics(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

// DID creation analytics with filters
export function useDIDCreationAnalytics(
  timeRange?: number,
  filters?: {
    did_method?: string
    status?: string
  }
) {
  const params = {
    ...(timeRange ? formatTimeRange(timeRange) : {}),
    ...filters,
  }

  return useAnalytics(() => AnalyticsAPI.did.getDIDCreationAnalytics(params), {
    refreshInterval: 30000,
    timeRange,
  })
}

// System events analytics
export function useSystemEvents(
  timeRange?: number,
  filters?: {
    event_type?: string
    level?: string
  }
) {
  const params = {
    ...(timeRange ? formatTimeRange(timeRange) : {}),
    ...filters,
  }

  return useAnalytics(() => AnalyticsAPI.system.getSystemEvents(params), {
    refreshInterval: 15000,
    timeRange,
  })
}

// Multi-analytics hook for dashboard overview
export function useAnalyticsDashboard(timeRange?: number) {
  const authAnalytics = useAuthAnalytics(timeRange)
  const oauth2Analytics = useOAuth2Analytics(timeRange)
  const didAnalytics = useDIDAnalytics(timeRange)
  const kmsAnalytics = useKMSAnalytics(timeRange)
  const tenantAnalytics = useTenantAnalytics(timeRange)
  const systemHealth = useSystemHealth()

  const loading =
    authAnalytics.loading ||
    oauth2Analytics.loading ||
    didAnalytics.loading ||
    kmsAnalytics.loading ||
    tenantAnalytics.loading ||
    systemHealth.loading

  const error =
    authAnalytics.error ||
    oauth2Analytics.error ||
    didAnalytics.error ||
    kmsAnalytics.error ||
    tenantAnalytics.error ||
    systemHealth.error

  const refetchAll = async () => {
    await Promise.all([
      authAnalytics.refetch(),
      oauth2Analytics.refetch(),
      didAnalytics.refetch(),
      kmsAnalytics.refetch(),
      tenantAnalytics.refetch(),
      systemHealth.refetch(),
    ])
  }

  return {
    auth: authAnalytics.data,
    oauth2: oauth2Analytics.data,
    did: didAnalytics.data,
    kms: kmsAnalytics.data,
    tenant: tenantAnalytics.data,
    system: systemHealth.data,
    loading,
    error,
    lastRefresh: new Date(Math.max(
      authAnalytics.lastRefresh.getTime(),
      oauth2Analytics.lastRefresh.getTime(),
      didAnalytics.lastRefresh.getTime(),
      kmsAnalytics.lastRefresh.getTime(),
      tenantAnalytics.lastRefresh.getTime(),
      systemHealth.lastRefresh.getTime()
    )),
    refetchAll,
  }
}
