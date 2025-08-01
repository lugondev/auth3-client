import { useState, useEffect, useCallback } from 'react'
import * as didService from '@/services/didService'

export interface DIDStats {
  total: number
  active: number
  deactivated: number
  revoked: number
  userManaged: number
  systemManaged: number
  byMethod: Record<string, number>
}

export interface UseDIDStatsReturn {
  stats: DIDStats
  loading: boolean
  error: string | null
  refetch: () => void
}

const defaultStats: DIDStats = {
  total: 0,
  active: 0,
  deactivated: 0,
  revoked: 0,
  userManaged: 0,
  systemManaged: 0,
  byMethod: {},
}

export function useDIDStats(): UseDIDStatsReturn {
  const [stats, setStats] = useState<DIDStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await didService.getDIDStatistics()

      const newStats: DIDStats = {
        total: response.total_dids || 0,
        active: response.active_dids || 0,
        deactivated: response.deactivated_dids || 0,
        revoked: response.revoked_dids || 0,
        userManaged: response.user_managed_dids || 0,
        systemManaged: response.system_managed_dids || 0,
        byMethod: response.dids_by_method || {},
      }

      setStats(newStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics'
      setError(errorMessage)
      setStats(defaultStats)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch,
  }
}
