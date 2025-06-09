// Token Storage Management for Dual Context
// Handles token isolation, backup, and restoration between global and tenant contexts

import { ContextMode, TokenStorage } from '@/types/dual-context'
import { jwtDecode } from 'jwt-decode'

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
  }
} as const

// Token validation interface
interface TokenPayload {
  sub: string
  email: string
  tenant_id?: string
  exp: number
  iat: number
}

// Global Token Storage Class
export class GlobalTokenStorage {
  private static instance: GlobalTokenStorage
  
  static getInstance(): GlobalTokenStorage {
    if (!GlobalTokenStorage.instance) {
      GlobalTokenStorage.instance = new GlobalTokenStorage()
    }
    return GlobalTokenStorage.instance
  }
  
  getTokens(): TokenStorage {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.global.accessToken)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.global.refreshToken)
      
      return {
        accessToken,
        refreshToken,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Failed to get global tokens:', error)
      return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }
  }
  
  setTokens(accessToken: string | null, refreshToken: string | null): void {
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
  
  clearTokens(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.global.accessToken)
      localStorage.removeItem(STORAGE_KEYS.global.refreshToken)
    } catch (error) {
      console.error('Failed to clear global tokens:', error)
    }
  }
  
  validateTokens(): boolean {
    const { accessToken } = this.getTokens()
    return this.isTokenValid(accessToken)
  }
  
  private isTokenValid(token: string | null): boolean {
    if (!token) return false
    
    try {
      const decoded = jwtDecode<TokenPayload>(token)
      return decoded.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }
}

// Tenant Token Storage Class
export class TenantTokenStorage {
  private static instance: TenantTokenStorage
  
  static getInstance(): TenantTokenStorage {
    if (!TenantTokenStorage.instance) {
      TenantTokenStorage.instance = new TenantTokenStorage()
    }
    return TenantTokenStorage.instance
  }
  
  getTokens(): TokenStorage {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.tenant.accessToken)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.tenant.refreshToken)
      
      return {
        accessToken,
        refreshToken,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Failed to get tenant tokens:', error)
      return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }
  }
  
  setTokens(accessToken: string | null, refreshToken: string | null): void {
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
  
  clearTokens(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.tenant.accessToken)
      localStorage.removeItem(STORAGE_KEYS.tenant.refreshToken)
    } catch (error) {
      console.error('Failed to clear tenant tokens:', error)
    }
  }
  
  validateTokens(): boolean {
    const { accessToken } = this.getTokens()
    return this.isTokenValid(accessToken)
  }
  
  private isTokenValid(token: string | null): boolean {
    if (!token) return false
    
    try {
      const decoded = jwtDecode<TokenPayload>(token)
      return decoded.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }
}

// Unified Token Manager
export class TokenManager {
  private globalStorage: GlobalTokenStorage
  private tenantStorage: TenantTokenStorage
  
  constructor() {
    this.globalStorage = GlobalTokenStorage.getInstance()
    this.tenantStorage = TenantTokenStorage.getInstance()
  }
  
  getTokens(context: ContextMode): TokenStorage {
    switch (context) {
      case 'global':
        return this.globalStorage.getTokens()
      case 'tenant':
        return this.tenantStorage.getTokens()
      case 'auto':
        // Auto mode returns tenant tokens if available, otherwise global
        const tenantTokens = this.tenantStorage.getTokens()
        if (tenantTokens.accessToken && this.tenantStorage.validateTokens()) {
          return tenantTokens
        }
        return this.globalStorage.getTokens()
      default:
        return { accessToken: null, refreshToken: null, timestamp: Date.now() }
    }
  }
  
  setTokens(context: ContextMode, accessToken: string | null, refreshToken: string | null): void {
    switch (context) {
      case 'global':
        this.globalStorage.setTokens(accessToken, refreshToken)
        break
      case 'tenant':
        this.tenantStorage.setTokens(accessToken, refreshToken)
        break
      case 'auto':
        // Auto mode sets tokens based on token content
        if (accessToken) {
          const tenantId = this.extractTenantId(accessToken)
          if (tenantId) {
            this.tenantStorage.setTokens(accessToken, refreshToken)
          } else {
            this.globalStorage.setTokens(accessToken, refreshToken)
          }
        }
        break
    }
  }
  
  clearTokens(context: ContextMode): void {
    switch (context) {
      case 'global':
        this.globalStorage.clearTokens()
        break
      case 'tenant':
        this.tenantStorage.clearTokens()
        break
      case 'auto':
        this.globalStorage.clearTokens()
        this.tenantStorage.clearTokens()
        break
    }
  }
  
  backupTokens(fromContext: ContextMode): void {
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
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.backup.accessToken)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.backup.refreshToken)
      
      if (accessToken || refreshToken) {
        this.setTokens(toContext, accessToken, refreshToken)
        // Clear backup after restore
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
  
  validateTokens(context: ContextMode): boolean {
    switch (context) {
      case 'global':
        return this.globalStorage.validateTokens()
      case 'tenant':
        return this.tenantStorage.validateTokens()
      case 'auto':
        return this.globalStorage.validateTokens() || this.tenantStorage.validateTokens()
      default:
        return false
    }
  }
  
  getTokenExpiry(context: ContextMode): number | null {
    const { accessToken } = this.getTokens(context)
    if (!accessToken) return null
    
    try {
      const decoded = jwtDecode<TokenPayload>(accessToken)
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
  
  private extractTenantId(token: string): string | null {
    try {
      const decoded = jwtDecode<TokenPayload>(token)
      return decoded.tenant_id || null
    } catch {
      return null
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager()

// Utility functions
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