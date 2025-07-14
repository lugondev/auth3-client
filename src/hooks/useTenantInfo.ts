import { useState, useEffect } from 'react'
import { getTenantById } from '@/services/tenantService'
import { TenantResponse } from '@/types/tenant'

export function useTenantInfo(tenantId: string | null) {
  const [tenantInfo, setTenantInfo] = useState<TenantResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) {
      setTenantInfo(null)
      return
    }

    const fetchTenantInfo = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await getTenantById(tenantId)
        setTenantInfo(response)
      } catch (err) {
        console.error('Failed to fetch tenant info:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch tenant info')
      } finally {
        setLoading(false)
      }
    }

    fetchTenantInfo()
  }, [tenantId])

  return {
    tenantInfo,
    tenantName: tenantInfo?.name,
    loading,
    error
  }
}
