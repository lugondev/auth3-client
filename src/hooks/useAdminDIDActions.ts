import { useState, useCallback } from 'react'
import { adminDeactivateDID, adminRevokeDID } from '@/services/didService'
import { toast } from '@/hooks/use-toast'

export interface UseAdminDIDActionsReturn {
  actionLoading: Record<string, boolean>
  deactivateDID: (didString: string) => Promise<void>
  revokeDID: (didString: string) => Promise<void>
}

export function useAdminDIDActions(onSuccess?: () => void): UseAdminDIDActionsReturn {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const deactivateDID = useCallback(async (didString: string) => {
    const actionKey = `deactivate-${didString}`
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }))

      await adminDeactivateDID(didString, 'Admin deactivation from dashboard')

      toast({
        title: 'Success',
        description: 'DID deactivated successfully',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Failed to deactivate DID:', error)
      toast({
        title: 'Error',
        description: 'Failed to deactivate DID',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [onSuccess])

  const revokeDID = useCallback(async (didString: string) => {
    const actionKey = `revoke-${didString}`
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }))

      await adminRevokeDID(didString, 'Admin revocation from dashboard')

      toast({
        title: 'Success',
        description: 'DID revoked successfully',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Failed to revoke DID:', error)
      toast({
        title: 'Error',
        description: 'Failed to revoke DID',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [onSuccess])

  return {
    actionLoading,
    deactivateDID,
    revokeDID,
  }
}
