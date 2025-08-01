import { useState, useEffect, useCallback } from 'react'
import * as didService from '@/services/didService'
import type { DIDResponse, ListDIDsInput } from '@/types/did'
import { toast } from '@/hooks/use-toast'

export interface UseDIDListReturn {
  dids: DIDResponse[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  refetch: () => void
  changePage: (page: number) => void
}

export function useDIDList(initialPageSize = 10): UseDIDListReturn {
  const [dids, setDids] = useState<DIDResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
  })

  const fetchDIDs = useCallback(async (page = 1, pageSize = initialPageSize) => {
    try {
      setLoading(true)
      setError(null)

      const params: ListDIDsInput = {
        limit: pageSize,
        page: page,
        sort: 'created_at_desc',
      }

      const response = await didService.listDIDs(params)
      
      setDids(response.dids || [])
      setPagination({
        page,
        pageSize,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / pageSize),
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load DIDs'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [initialPageSize])

  const changePage = useCallback((page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      fetchDIDs(page, pagination.pageSize)
    }
  }, [fetchDIDs, pagination.totalPages, pagination.pageSize])

  const refetch = useCallback(() => {
    fetchDIDs(pagination.page, pagination.pageSize)
  }, [fetchDIDs, pagination.page, pagination.pageSize])

  useEffect(() => {
    fetchDIDs()
  }, [fetchDIDs])

  return {
    dids,
    loading,
    error,
    pagination,
    refetch,
    changePage,
  }
}
