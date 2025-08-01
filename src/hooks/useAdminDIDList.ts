import { useState, useEffect, useCallback } from 'react'
import { getDIDStatistics, adminListDIDs } from '@/services/didService'
import { getUserById } from '@/services/userService'
import type { DIDStatisticsOutput, ListDIDsOutput, DIDResponse, DIDMethod, DIDStatus } from '@/types/did'
import type { UserOutput } from '@/types/user'
import { toast } from '@/hooks/use-toast'

export interface AdminDIDStats {
  totalDIDs: number
  activeUsers: number
  methodDistribution: Record<string, number>
  recentActivity: {
    created: number
    deactivated: number
    revoked: number
  }
}

export interface AdminDIDRecord {
  id: string
  did: string
  method: string
  status: string
  owner: {
    id: string
    email: string
    username?: string
  }
  createdAt: string
  updatedAt: string
}

export interface UseAdminDIDListReturn {
  dids: AdminDIDRecord[]
  stats: AdminDIDStats | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    searchTerm: string
    methodFilter: string
    statusFilter: string
  }
  refetch: () => void
  setSearchTerm: (term: string) => void
  setMethodFilter: (method: string) => void
  setStatusFilter: (status: string) => void
  changePage: (page: number) => void
}

export function useAdminDIDList(): UseAdminDIDListReturn {
  const [dids, setDids] = useState<AdminDIDRecord[]>([])
  const [stats, setStats] = useState<AdminDIDStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    methodFilter: 'all',
    statusFilter: 'all',
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch DID statistics
      const statsData: DIDStatisticsOutput = await getDIDStatistics()
      
      const transformedStats: AdminDIDStats = {
        totalDIDs: statsData.total_dids || 0,
        activeUsers: statsData.active_dids || 0,
        methodDistribution: statsData.dids_by_method || {},
        recentActivity: {
          created: statsData.dids_created_today || 0,
          deactivated: statsData.deactivated_dids || 0,
          revoked: statsData.revoked_dids || 0,
        },
      }

      // Fetch DIDs list
      const didsData: ListDIDsOutput = await adminListDIDs({
        limit: pagination.pageSize,
        offset: (pagination.page - 1) * pagination.pageSize,
        status: filters.statusFilter !== 'all' ? (filters.statusFilter as DIDStatus) : undefined,
        method: filters.methodFilter !== 'all' ? (filters.methodFilter as DIDMethod) : undefined,
      })

      // Transform DIDs with user data
      const transformedDIDs: AdminDIDRecord[] = await Promise.all(
        didsData.dids.map(async (did: DIDResponse) => {
          let userEmail = 'unknown@example.com'
          let username: string | undefined = undefined

          try {
            const userData: UserOutput = await getUserById(did.user_id)
            userEmail = userData.email

            if (userData.first_name || userData.last_name) {
              username = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || undefined
            }
          } catch (error) {
            console.warn(`Failed to fetch user data for user_id: ${did.user_id}`)
          }

          return {
            id: did.id,
            did: did.did,
            method: did.method,
            status: did.status,
            owner: {
              id: did.user_id,
              email: userEmail,
              username,
            },
            createdAt: did.created_at,
            updatedAt: did.updated_at,
          }
        })
      )

      setStats(transformedStats)
      setDids(transformedDIDs)
      setPagination(prev => ({
        ...prev,
        total: didsData.total,
        totalPages: Math.ceil(didsData.total / prev.pageSize),
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch DID admin data'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, filters.statusFilter, filters.methodFilter])

  const changePage = useCallback((page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }))
    }
  }, [pagination.totalPages])

  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }))
  }, [])

  const setMethodFilter = useCallback((method: string) => {
    setFilters(prev => ({ ...prev, methodFilter: method }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const setStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, statusFilter: status }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    dids,
    stats,
    loading,
    error,
    pagination,
    filters,
    refetch,
    setSearchTerm,
    setMethodFilter,
    setStatusFilter,
    changePage,
  }
}
