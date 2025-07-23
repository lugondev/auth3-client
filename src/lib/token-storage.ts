// Unified Token Storage Management for Dual Context
// Handles token isolation, backup, and restoration between global and tenant contexts
// Uses reactive localStorage hooks and maintains backward compatibility

import { ContextMode, TokenStorage } from '@/types/dual-context'
import { decodeJwt } from './jwt'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useCallback, useMemo, useEffect } from 'react'

// Storage keys for different contexts
const STORAGE_KEYS = {
  global: {
    accessToken: 'global_accessToken',
    refreshToken: 'global_refreshToken',
  },
  tenant: {
    accessToken: 'tenant_accessToken',
    refreshToken: 'tenant_refreshToken',
  },
  backup: {
    accessToken: 'backup_accessToken',
    refreshToken: 'backup_refreshToken',
  },
  currentMode: 'auth_current_mode'
} as const

// Token validation interface
interface TokenPayload {
  sub: string
  email: string
  tenant_id?: string
  exp: number
  iat: number
}

// ========================================
// REACT HOOKS VERSION (Primary)
// ========================================

// Enhanced Token Storage Hook using useLocalStorage
export const useTokenStorage = () => {
  // Global tokens with reactive localStorage
  const [globalAccessToken, setGlobalAccessToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.global.accessToken, 
    null
  )
  const [globalRefreshToken, setGlobalRefreshToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.global.refreshToken, 
    null
  )

  // Tenant tokens with reactive localStorage
  const [tenantAccessToken, setTenantAccessToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.tenant.accessToken, 
    null
  )
  const [tenantRefreshToken, setTenantRefreshToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.tenant.refreshToken, 
    null
  )

  // Current context mode
  const [currentMode, setCurrentMode] = useLocalStorage<ContextMode>(
    STORAGE_KEYS.currentMode,
    'global'
  )

  // Backup tokens
  const [backupAccessToken, setBackupAccessToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.backup.accessToken,
    null
  )
  const [backupRefreshToken, setBackupRefreshToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.backup.refreshToken,
    null
  )

  // Helper function to validate token
  const isTokenValid = useCallback((token: string | null): boolean => {
    if (!token) return false

    try {
      const decoded = decodeJwt<TokenPayload>(token)
      return decoded.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }, [])

  // Extract tenant ID from token
  const extractTenantId = useCallback((token: string): string | null => {
    try {
      const decoded = decodeJwt<TokenPayload>(token)
      return decoded.tenant_id || null
    } catch {
      return null
    }
  }, [])

  // Get tokens for specific context
  const getTokens = useCallback((context: ContextMode): TokenStorage => {
    switch (context) {
      case 'global':
        return {
          accessToken: globalAccessToken,
          refreshToken: globalRefreshToken,
          timestamp: Date.now()
        }
      case 'tenant':
        return {
          accessToken: tenantAccessToken,
          refreshToken: tenantRefreshToken,
          timestamp: Date.now()
        }
      case 'auto':
        // Auto mode returns tenant tokens if available and valid, otherwise global
        if (tenantAccessToken && isTokenValid(tenantAccessToken)) {
          return {
            accessToken: tenantAccessToken,
            refreshToken: tenantRefreshToken,
            timestamp: Date.now()
          }
        }
        return {
          accessToken: globalAccessToken,
          refreshToken: globalRefreshToken,
          timestamp: Date.now()
        }
      default:
        return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }
  }, [globalAccessToken, globalRefreshToken, tenantAccessToken, tenantRefreshToken, isTokenValid])

  // Set tokens for specific context
  const setTokens = useCallback((
    context: ContextMode, 
    accessToken: string | null, 
    refreshToken: string | null
  ): void => {
    console.log(`📝 Setting tokens for ${context} context`, {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    })

    switch (context) {
      case 'global':
        setGlobalAccessToken(accessToken)
        setGlobalRefreshToken(refreshToken)
        break
      case 'tenant':
        setTenantAccessToken(accessToken)
        setTenantRefreshToken(refreshToken)
        break
      case 'auto':
        // Auto mode sets tokens based on token content
        if (accessToken) {
          const tenantId = extractTenantId(accessToken)
          if (tenantId) {
            console.log(`🏢 Auto-detected tenant token: ${tenantId}`)
            setTenantAccessToken(accessToken)
            setTenantRefreshToken(refreshToken)
          } else {
            console.log(`🌐 Auto-detected global token`)
            setGlobalAccessToken(accessToken)
            setGlobalRefreshToken(refreshToken)
          }
        }
        break
    }
  }, [setGlobalAccessToken, setGlobalRefreshToken, setTenantAccessToken, setTenantRefreshToken, extractTenantId])

  // Clear tokens for specific context
  const clearTokens = useCallback((context: ContextMode): void => {
    console.log(`🗑️ Clearing tokens for ${context} context`)
    
    switch (context) {
      case 'global':
        setGlobalAccessToken(null)
        setGlobalRefreshToken(null)
        break
      case 'tenant':
        setTenantAccessToken(null)
        setTenantRefreshToken(null)
        break
      case 'auto':
        setGlobalAccessToken(null)
        setGlobalRefreshToken(null)
        setTenantAccessToken(null)
        setTenantRefreshToken(null)
        break
    }
  }, [setGlobalAccessToken, setGlobalRefreshToken, setTenantAccessToken, setTenantRefreshToken])

  // Backup tokens
  const backupTokens = useCallback((fromContext: ContextMode): void => {
    const tokens = getTokens(fromContext)
    console.log(`💾 Backing up tokens from ${fromContext} context`)
    setBackupAccessToken(tokens.accessToken)
    setBackupRefreshToken(tokens.refreshToken)
  }, [getTokens, setBackupAccessToken, setBackupRefreshToken])

  // Restore tokens from backup
  const restoreTokens = useCallback((toContext: ContextMode): boolean => {
    if (backupAccessToken || backupRefreshToken) {
      console.log(`🔄 Restoring tokens to ${toContext} context`)
      setTokens(toContext, backupAccessToken, backupRefreshToken)
      // Clear backup after restore
      setBackupAccessToken(null)
      setBackupRefreshToken(null)
      return true
    }
    return false
  }, [backupAccessToken, backupRefreshToken, setTokens, setBackupAccessToken, setBackupRefreshToken])

  // Validate tokens for specific context
  const validateTokens = useCallback((context: ContextMode): boolean => {
    const tokens = getTokens(context)
    return isTokenValid(tokens.accessToken)
  }, [getTokens, isTokenValid])

  // Get token expiry
  const getTokenExpiry = useCallback((context: ContextMode): number | null => {
    const tokens = getTokens(context)
    if (!tokens.accessToken) return null

    try {
      const decoded = decodeJwt<TokenPayload>(tokens.accessToken)
      return decoded.exp * 1000
    } catch {
      return null
    }
  }, [getTokens])

  // Check if token is expiring soon
  const isTokenExpiringSoon = useCallback((
    context: ContextMode, 
    marginMs: number = 5 * 60 * 1000
  ): boolean => {
    const expiry = getTokenExpiry(context)
    if (!expiry) return true
    return expiry - Date.now() < marginMs
  }, [getTokenExpiry])

  // Get current active tokens based on current mode
  const currentTokens = useMemo(() => getTokens(currentMode), [getTokens, currentMode])

  // Check if currently authenticated
  const isAuthenticated = useMemo(() => 
    isTokenValid(currentTokens.accessToken), 
    [currentTokens.accessToken, isTokenValid]
  )

  // Get current user info from token
  const currentUser = useMemo(() => {
    if (!currentTokens.accessToken) return null
    
    try {
      const decoded = decodeJwt<TokenPayload>(currentTokens.accessToken)
      return {
        id: decoded.sub,
        email: decoded.email,
        tenant_id: decoded.tenant_id,
        exp: decoded.exp
      }
    } catch {
      return null
    }
  }, [currentTokens.accessToken])

  // Auto-cleanup expired tokens
  useEffect(() => {
    const interval = setInterval(() => {
      // Check and clear expired global tokens
      if (globalAccessToken && !isTokenValid(globalAccessToken)) {
        console.log('🧹 Auto-cleaning expired global tokens')
        setGlobalAccessToken(null)
        setGlobalRefreshToken(null)
      }

      // Check and clear expired tenant tokens
      if (tenantAccessToken && !isTokenValid(tenantAccessToken)) {
        console.log('🧹 Auto-cleaning expired tenant tokens')
        setTenantAccessToken(null)
        setTenantRefreshToken(null)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [
    globalAccessToken, 
    tenantAccessToken, 
    isTokenValid, 
    setGlobalAccessToken, 
    setGlobalRefreshToken, 
    setTenantAccessToken, 
    setTenantRefreshToken
  ])

  return {
    // Current state
    currentMode,
    setCurrentMode,
    currentTokens,
    isAuthenticated,
    currentUser,

    // Token management
    getTokens,
    setTokens,
    clearTokens,
    validateTokens,

    // Backup/restore
    backupTokens,
    restoreTokens,

    // Utilities
    getTokenExpiry,
    isTokenExpiringSoon,
    extractTenantId,
    isTokenValid,

    // Raw token states (for debugging)
    globalTokens: {
      accessToken: globalAccessToken,
      refreshToken: globalRefreshToken
    },
    tenantTokens: {
      accessToken: tenantAccessToken,
      refreshToken: tenantRefreshToken
    },
    backupTokensState: {
      accessToken: backupAccessToken,
      refreshToken: backupRefreshToken
    }
  }
}

// ========================================
// LEGACY CLASS-BASED VERSION (Backward Compatibility)
// ========================================

// Legacy Token Manager for backward compatibility
// Uses direct localStorage access when hooks are not available
export class TokenManager {
  private static instance: TokenManager

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }

  getTokens(context: ContextMode): TokenStorage {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }

    switch (context) {
      case 'global':
        return this.getGlobalTokens()
      case 'tenant':
        return this.getTenantTokens()
      case 'auto':
        const tenantTokens = this.getTenantTokens()
        if (tenantTokens.accessToken && this.isTokenValid(tenantTokens.accessToken)) {
          return tenantTokens
        }
        return this.getGlobalTokens()
      default:
        return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }
  }

  private getGlobalTokens(): TokenStorage {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.global.accessToken)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.global.refreshToken)
      return { accessToken, refreshToken, timestamp: Date.now() }
    } catch (error) {
      console.error('Failed to get global tokens:', error)
      return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }
  }

  private getTenantTokens(): TokenStorage {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.tenant.accessToken)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.tenant.refreshToken)
      return { accessToken, refreshToken, timestamp: Date.now() }
    } catch (error) {
      console.error('Failed to get tenant tokens:', error)
      return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }
  }

  setTokens(context: ContextMode, accessToken: string | null, refreshToken: string | null): void {
    if (typeof window === 'undefined') return

    switch (context) {
      case 'global':
        this.setGlobalTokens(accessToken, refreshToken)
        break
      case 'tenant':
        this.setTenantTokens(accessToken, refreshToken)
        break
      case 'auto':
        if (accessToken) {
          const tenantId = this.extractTenantId(accessToken)
          if (tenantId) {
            this.setTenantTokens(accessToken, refreshToken)
          } else {
            this.setGlobalTokens(accessToken, refreshToken)
          }
        }
        break
    }
  }

  private setGlobalTokens(accessToken: string | null, refreshToken: string | null): void {
    try {
      if (accessToken) {
        localStorage.setItem(STORAGE_KEYS.global.accessToken, accessToken)
      } else {
        localStorage.removeItem(STORAGE_KEYS.global.accessToken)
      }

      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.global.refreshToken, refreshToken)
      } else {
        localStorage.removeItem(STORAGE_KEYS.global.refreshToken)
      }
    } catch (error) {
      console.error('Failed to set global tokens:', error)
    }
  }

  private setTenantTokens(accessToken: string | null, refreshToken: string | null): void {
    try {
      if (accessToken) {
        localStorage.setItem(STORAGE_KEYS.tenant.accessToken, accessToken)
      } else {
        localStorage.removeItem(STORAGE_KEYS.tenant.accessToken)
      }

      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.tenant.refreshToken, refreshToken)
      } else {
        localStorage.removeItem(STORAGE_KEYS.tenant.refreshToken)
      }
    } catch (error) {
      console.error('Failed to set tenant tokens:', error)
    }
  }

  clearTokens(context: ContextMode): void {
    if (typeof window === 'undefined') return

    switch (context) {
      case 'global':
        localStorage.removeItem(STORAGE_KEYS.global.accessToken)
        localStorage.removeItem(STORAGE_KEYS.global.refreshToken)
        break
      case 'tenant':
        localStorage.removeItem(STORAGE_KEYS.tenant.accessToken)
        localStorage.removeItem(STORAGE_KEYS.tenant.refreshToken)
        break
      case 'auto':
        localStorage.removeItem(STORAGE_KEYS.global.accessToken)
        localStorage.removeItem(STORAGE_KEYS.global.refreshToken)
        localStorage.removeItem(STORAGE_KEYS.tenant.accessToken)
        localStorage.removeItem(STORAGE_KEYS.tenant.refreshToken)
        break
    }
  }

  validateTokens(context: ContextMode): boolean {
    const { accessToken } = this.getTokens(context)
    return this.isTokenValid(accessToken)
  }

  private isTokenValid(token: string | null): boolean {
    if (!token) return false

    try {
      const decoded = decodeJwt<TokenPayload>(token)
      return decoded.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  private extractTenantId(token: string): string | null {
    try {
      const decoded = decodeJwt<TokenPayload>(token)
      return decoded.tenant_id || null
    } catch {
      return null
    }
  }

  getTokenExpiry(context: ContextMode): number | null {
    const { accessToken } = this.getTokens(context)
    if (!accessToken) return null

    try {
      const decoded = decodeJwt<TokenPayload>(accessToken)
      return decoded.exp * 1000
    } catch {
      return null
    }
  }

  isTokenExpiringSoon(context: ContextMode, marginMs: number = 5 * 60 * 1000): boolean {
    const expiry = this.getTokenExpiry(context)
    if (!expiry) return true
    return expiry - Date.now() < marginMs
  }

  backupTokens(fromContext: ContextMode): void {
    if (typeof window === 'undefined') return

    const tokens = this.getTokens(fromContext)
    try {
      if (tokens.accessToken) {
        localStorage.setItem(STORAGE_KEYS.backup.accessToken, tokens.accessToken)
      }
      if (tokens.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.backup.refreshToken, tokens.refreshToken)
      }
    } catch (error) {
      console.error('Failed to backup tokens:', error)
    }
  }

  restoreTokens(toContext: ContextMode): boolean {
    if (typeof window === 'undefined') return false

    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.backup.accessToken)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.backup.refreshToken)

      if (accessToken || refreshToken) {
        this.setTokens(toContext, accessToken, refreshToken)
        localStorage.removeItem(STORAGE_KEYS.backup.accessToken)
        localStorage.removeItem(STORAGE_KEYS.backup.refreshToken)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to restore tokens:', error)
      return false
    }
  }
}

// Export singleton instance for backward compatibility
export const tokenManager = new TokenManager()

// ========================================
// UTILITY FUNCTIONS (Backward Compatibility)
// ========================================

export const getActiveTokens = (context: ContextMode): TokenStorage => {
  return tokenManager.getTokens(context)
}

export const setActiveTokens = (context: ContextMode, accessToken: string | null, refreshToken: string | null): void => {
  tokenManager.setTokens(context, accessToken, refreshToken)
}

export const clearActiveTokens = (context: ContextMode): void => {
  tokenManager.clearTokens(context)
}

export const validateActiveTokens = (context: ContextMode): boolean => {
  return tokenManager.validateTokens(context)
}

// ========================================
// EXPORT TYPES
// ========================================

export type ReactiveTokenStorage = ReturnType<typeof useTokenStorage>
export { STORAGE_KEYS }