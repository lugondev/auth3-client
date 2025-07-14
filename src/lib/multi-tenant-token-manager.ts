// Multi-Tenant Token Manager
// Handles per-tenant token storage and validation
// Manages tokens for multiple tenants simultaneously

import { decodeJwt } from './jwt'

interface TokenPayload {
  sub: string
  email: string
  tenant_id?: string
  exp: number
  iat: number
}

interface TenantTokens {
  accessToken: string | null
  refreshToken: string | null
  timestamp: number
  tenantId: string
}

interface TokenValidationResult {
  isValid: boolean
  isExpired: boolean
  tenantId?: string
  expiresAt?: number
}

export class MultiTenantTokenManager {
  private static instance: MultiTenantTokenManager
  private readonly STORAGE_PREFIX = 'tenant_'
  private readonly GLOBAL_PREFIX = 'global_'

  static getInstance(): MultiTenantTokenManager {
    if (!MultiTenantTokenManager.instance) {
      MultiTenantTokenManager.instance = new MultiTenantTokenManager()
    }
    return MultiTenantTokenManager.instance
  }

  /**
   * Get tokens for a specific tenant
   */
  getTenantTokens(tenantId: string): TenantTokens {
    if (typeof window === 'undefined') {
      return this.createEmptyTokens(tenantId)
    }

    try {
      const accessToken = localStorage.getItem(`${this.STORAGE_PREFIX}${tenantId}_access`)
      const refreshToken = localStorage.getItem(`${this.STORAGE_PREFIX}${tenantId}_refresh`)
      const timestamp = parseInt(localStorage.getItem(`${this.STORAGE_PREFIX}${tenantId}_timestamp`) || '0')

      return {
        accessToken,
        refreshToken,
        timestamp: timestamp || Date.now(),
        tenantId
      }
    } catch (error) {
      console.error(`Failed to get tokens for tenant ${tenantId}:`, error)
      return this.createEmptyTokens(tenantId)
    }
  }

  /**
   * Set tokens for a specific tenant
   */
  setTenantTokens(tenantId: string, accessToken: string | null, refreshToken: string | null): void {
    if (typeof window === 'undefined') return

    try {
      const timestamp = Date.now().toString()

      if (accessToken) {
        localStorage.setItem(`${this.STORAGE_PREFIX}${tenantId}_access`, accessToken)
      } else {
        localStorage.removeItem(`${this.STORAGE_PREFIX}${tenantId}_access`)
      }

      if (refreshToken) {
        localStorage.setItem(`${this.STORAGE_PREFIX}${tenantId}_refresh`, refreshToken)
      } else {
        localStorage.removeItem(`${this.STORAGE_PREFIX}${tenantId}_refresh`)
      }

      localStorage.setItem(`${this.STORAGE_PREFIX}${tenantId}_timestamp`, timestamp)
    } catch (error) {
      console.error(`Failed to set tokens for tenant ${tenantId}:`, error)
    }
  }

  /**
   * Clear tokens for a specific tenant
   */
  clearTenantTokens(tenantId: string): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${tenantId}_access`)
      localStorage.removeItem(`${this.STORAGE_PREFIX}${tenantId}_refresh`)
      localStorage.removeItem(`${this.STORAGE_PREFIX}${tenantId}_timestamp`)
    } catch (error) {
      console.error(`Failed to clear tokens for tenant ${tenantId}:`, error)
    }
  }

  /**
   * Validate tokens for a specific tenant
   */
  validateTenantTokens(tenantId: string): TokenValidationResult {
    const tokens = this.getTenantTokens(tenantId)
    
    if (!tokens.accessToken) {
      return { isValid: false, isExpired: true }
    }

    try {
      const decoded = decodeJwt<TokenPayload>(tokens.accessToken)
      const now = Date.now()
      const expiresAt = decoded.exp * 1000
      const isExpired = expiresAt <= now
      const isValid = !isExpired && decoded.tenant_id === tenantId

      return {
        isValid,
        isExpired,
        tenantId: decoded.tenant_id,
        expiresAt
      }
    } catch (error) {
      console.error(`Failed to validate tokens for tenant ${tenantId}:`, error)
      return { isValid: false, isExpired: true }
    }
  }

  /**
   * Check if tokens are expiring soon (default: 5 minutes)
   */
  isTokenExpiringSoon(tenantId: string, marginMs: number = 5 * 60 * 1000): boolean {
    const validation = this.validateTenantTokens(tenantId)
    
    if (!validation.isValid || !validation.expiresAt) return true
    
    return validation.expiresAt - Date.now() < marginMs
  }

  /**
   * Get all stored tenant IDs
   */
  getAllTenantIds(): string[] {
    if (typeof window === 'undefined') return []

    try {
      const tenantIds = new Set<string>()
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const parts = key.split('_')
          if (parts.length >= 3) {
            const tenantId = parts[1]
            tenantIds.add(tenantId)
          }
        }
      }
      
      return Array.from(tenantIds)
    } catch (error) {
      console.error('Failed to get all tenant IDs:', error)
      return []
    }
  }

  /**
   * Clear all tenant tokens
   */
  clearAllTenantTokens(): void {
    const tenantIds = this.getAllTenantIds()
    tenantIds.forEach(tenantId => this.clearTenantTokens(tenantId))
  }

  /**
   * Get tokens summary for debugging
   */
  getTokensSummary(): Record<string, { isValid: boolean; expiresAt?: number; tenantId?: string }> {
    const summary: Record<string, { isValid: boolean; expiresAt?: number; tenantId?: string }> = {}
    const tenantIds = this.getAllTenantIds()
    
    tenantIds.forEach(tenantId => {
      const validation = this.validateTenantTokens(tenantId)
      summary[tenantId] = {
        isValid: validation.isValid,
        expiresAt: validation.expiresAt,
        tenantId: validation.tenantId
      }
    })
    
    return summary
  }

  /**
   * Global token methods (for backward compatibility)
   */
  getGlobalTokens(): TenantTokens {
    if (typeof window === 'undefined') {
      return this.createEmptyTokens('global')
    }

    try {
      const accessToken = localStorage.getItem(`${this.GLOBAL_PREFIX}access`)
      const refreshToken = localStorage.getItem(`${this.GLOBAL_PREFIX}refresh`)
      const timestamp = parseInt(localStorage.getItem(`${this.GLOBAL_PREFIX}timestamp`) || '0')

      return {
        accessToken,
        refreshToken,
        timestamp: timestamp || Date.now(),
        tenantId: 'global'
      }
    } catch (error) {
      console.error('Failed to get global tokens:', error)
      return this.createEmptyTokens('global')
    }
  }

  setGlobalTokens(accessToken: string | null, refreshToken: string | null): void {
    if (typeof window === 'undefined') return

    try {
      const timestamp = Date.now().toString()

      if (accessToken) {
        localStorage.setItem(`${this.GLOBAL_PREFIX}access`, accessToken)
      } else {
        localStorage.removeItem(`${this.GLOBAL_PREFIX}access`)
      }

      if (refreshToken) {
        localStorage.setItem(`${this.GLOBAL_PREFIX}refresh`, refreshToken)
      } else {
        localStorage.removeItem(`${this.GLOBAL_PREFIX}refresh`)
      }

      localStorage.setItem(`${this.GLOBAL_PREFIX}timestamp`, timestamp)
    } catch (error) {
      console.error('Failed to set global tokens:', error)
    }
  }

  clearGlobalTokens(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(`${this.GLOBAL_PREFIX}access`)
      localStorage.removeItem(`${this.GLOBAL_PREFIX}refresh`)
      localStorage.removeItem(`${this.GLOBAL_PREFIX}timestamp`)
    } catch (error) {
      console.error('Failed to clear global tokens:', error)
    }
  }

  validateGlobalTokens(): TokenValidationResult {
    const tokens = this.getGlobalTokens()
    
    if (!tokens.accessToken) {
      return { isValid: false, isExpired: true }
    }

    try {
      const decoded = decodeJwt<TokenPayload>(tokens.accessToken)
      const now = Date.now()
      const expiresAt = decoded.exp * 1000
      const isExpired = expiresAt <= now
      const isValid = !isExpired && !decoded.tenant_id // Global tokens should not have tenant_id

      return {
        isValid,
        isExpired,
        expiresAt
      }
    } catch (error) {
      console.error('Failed to validate global tokens:', error)
      return { isValid: false, isExpired: true }
    }
  }

  private createEmptyTokens(tenantId: string): TenantTokens {
    return {
      accessToken: null,
      refreshToken: null,
      timestamp: Date.now(),
      tenantId
    }
  }
}

// Export singleton instance
export const multiTenantTokenManager = MultiTenantTokenManager.getInstance()

// Utility functions
export const getTenantTokens = (tenantId: string): TenantTokens => {
  return multiTenantTokenManager.getTenantTokens(tenantId)
}

export const setTenantTokens = (tenantId: string, accessToken: string | null, refreshToken: string | null): void => {
  multiTenantTokenManager.setTenantTokens(tenantId, accessToken, refreshToken)
}

export const validateTenantTokens = (tenantId: string): TokenValidationResult => {
  return multiTenantTokenManager.validateTenantTokens(tenantId)
}

export const clearTenantTokens = (tenantId: string): void => {
  multiTenantTokenManager.clearTenantTokens(tenantId)
}
