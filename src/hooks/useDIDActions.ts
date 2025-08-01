import { useState, useCallback } from 'react'
import * as didService from '@/services/didService'
import type { DIDResponse } from '@/types/did'
import { DIDStatus } from '@/types/did'
import { toast } from '@/hooks/use-toast'

export interface UseDIDActionsReturn {
  actionLoading: Record<string, boolean>
  deactivateDID: (did: DIDResponse) => Promise<void>
  revokeDID: (did: DIDResponse) => Promise<void>
}

export function useDIDActions(onSuccess?: () => void): UseDIDActionsReturn {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const deactivateDID = useCallback(async (did: DIDResponse) => {
    const actionKey = `deactivate-${did.id}`
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }))

      await didService.deactivateDID({
        id: did.id,
        did: String(did.did),
        user_id: did.user_id,
        reason: 'User requested deactivation',
      })

      toast({
        title: 'Success',
        description: 'DID deactivated successfully',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Error deactivating DID:', error)
      toast({
        title: 'Error',
        description: 'Failed to deactivate DID',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [onSuccess])

  const revokeDID = useCallback(async (did: DIDResponse) => {
    const actionKey = `revoke-${did.id}`
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }))

      await didService.revokeDID({
        id: did.id,
        did: String(did.did),
        user_id: did.user_id,
        reason: 'User requested revocation',
      })

      toast({
        title: 'Success',
        description: 'DID revoked successfully',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Error revoking DID:', error)
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
