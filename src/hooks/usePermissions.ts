import { useState, useEffect, useCallback } from 'react'
import { 
  getUserPermissions, 
  clearPermissionsCache, 
  preloadPermissions,
  checkPermission,
  hasAnyPermission,
  hasAllPermissions
} from '@/services/permissionService'
import { UserPermissionsResponse } from '@/types/permission'
import { useAuth } from '@/contexts/AuthContext'

interface UsePermissionsOptions {
  tenantId?: string
  autoLoad?: boolean // Auto load permissions on mount
  dependencies?: any[] // Dependencies to trigger reload
}

interface UsePermissionsReturn {
  permissions: UserPermissionsResponse | null
  loading: boolean
  error: string | null
  
  // Actions
  loadPermissions: (forceRefresh?: boolean) => Promise<void>
  clearCache: () => void
  
  // Permission checks
  checkPermission: (object: string, action: string) => Promise<boolean>
  hasAnyPermission: (permissions: Array<{ object: string; action: string }>) => Promise<boolean>
  hasAllPermissions: (permissions: Array<{ object: string; action: string }>) => Promise<boolean>
  
  // Utilities
  hasPermission: (object: string, action: string) => boolean // Sync check from current state
  isLoaded: boolean
}

export const usePermissions = (options: UsePermissionsOptions = {}): UsePermissionsReturn => {
  const { tenantId, autoLoad = true, dependencies = [] } = options
  const { isAuthenticated, user } = useAuth()
  
  const [permissions, setPermissions] = useState<UserPermissionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) {
      setPermissions(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const perms = await getUserPermissions(tenantId, forceRefresh)
      setPermissions(perms)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load permissions'
      setError(errorMessage)
      console.error('Failed to load permissions:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, tenantId])

  const clearCache = useCallback(() => {
    clearPermissionsCache(tenantId)
    setPermissions(null)
  }, [tenantId])

  // Sync permission check from current state (no API call)
  const hasPermission = useCallback((object: string, action: string): boolean => {
    if (!permissions) return false
    return permissions.permissions.some(
      ([permObject, permAction]) => permObject === object && permAction === action
    )
  }, [permissions])

  // Async permission checks (uses cache)
  const checkPermissionAsync = useCallback(async (object: string, action: string): Promise<boolean> => {
    const result = await checkPermission(object, action, tenantId)
    return result.hasPermission
  }, [tenantId])

  const hasAnyPermissionAsync = useCallback(async (perms: Array<{ object: string; action: string }>): Promise<boolean> => {
    return hasAnyPermission(perms, tenantId)
  }, [tenantId])

  const hasAllPermissionsAsync = useCallback(async (perms: Array<{ object: string; action: string }>): Promise<boolean> => {
    return hasAllPermissions(perms, tenantId)
  }, [tenantId])

  // Auto load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad && isAuthenticated) {
      loadPermissions(false) // Use cache if available
    }
  }, [autoLoad, isAuthenticated, loadPermissions, ...dependencies])

  // Clear cache when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setPermissions(null)
      setError(null)
    }
  }, [isAuthenticated])

  // Clear cache when user changes (in case of user switching)
  useEffect(() => {
    if (user) {
      // User might have changed, clear cache to avoid stale permissions
      clearCache()
      if (isAuthenticated && autoLoad) {
        loadPermissions(true) // Force refresh for new user
      }
    }
  }, [user?.id]) // Only depend on user ID to avoid unnecessary reloads

  return {
    permissions,
    loading,
    error,
    loadPermissions,
    clearCache,
    checkPermission: checkPermissionAsync,
    hasAnyPermission: hasAnyPermissionAsync,
    hasAllPermissions: hasAllPermissionsAsync,
    hasPermission,
    isLoaded: permissions !== null
  }
}

// Specialized hook for tenant permissions
export const useTenantPermissions = (tenantId: string, autoLoad: boolean = true) => {
  return usePermissions({ tenantId, autoLoad })
}

// Specialized hook for global permissions
export const useGlobalPermissions = (autoLoad: boolean = true) => {
  return usePermissions({ autoLoad })
}
