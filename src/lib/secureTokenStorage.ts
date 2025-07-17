/**
 * Secure token storage utilities for OAuth2 tokens
 * Provides encryption and secure storage mechanisms
 */

export interface StoredToken {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
  expires_at: number
  client_id: string
  created_at: number
}

export interface TokenStorage {
  store(key: string, token: StoredToken): Promise<void>
  retrieve(key: string): Promise<StoredToken | null>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  isSupported(): boolean
}

/**
 * Simple localStorage-based token storage
 * Note: In production, consider using encrypted storage
 */
class LocalStorageTokenStorage implements TokenStorage {
  private readonly prefix = 'oauth2_token_'

  async store(key: string, token: StoredToken): Promise<void> {
    try {
      const storageKey = this.prefix + key
      const serialized = JSON.stringify(token)
      localStorage.setItem(storageKey, serialized)
    } catch (error) {
      console.error('Failed to store token:', error)
      throw new Error('Token storage failed')
    }
  }

  async retrieve(key: string): Promise<StoredToken | null> {
    try {
      const storageKey = this.prefix + key
      const serialized = localStorage.getItem(storageKey)
      
      if (!serialized) return null
      
      const token: StoredToken = JSON.parse(serialized)
      
      // Check if token is expired
      if (token.expires_at && token.expires_at <= Date.now()) {
        await this.remove(key)
        return null
      }
      
      return token
    } catch (error) {
      console.error('Failed to retrieve token:', error)
      return null
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const storageKey = this.prefix + key
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to remove token:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }

  isSupported(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}

/**
 * SessionStorage-based token storage (less persistent)
 */
class SessionStorageTokenStorage implements TokenStorage {
  private readonly prefix = 'oauth2_token_'

  async store(key: string, token: StoredToken): Promise<void> {
    try {
      const storageKey = this.prefix + key
      const serialized = JSON.stringify(token)
      sessionStorage.setItem(storageKey, serialized)
    } catch (error) {
      console.error('Failed to store token in session:', error)
      throw new Error('Token storage failed')
    }
  }

  async retrieve(key: string): Promise<StoredToken | null> {
    try {
      const storageKey = this.prefix + key
      const serialized = sessionStorage.getItem(storageKey)
      
      if (!serialized) return null
      
      const token: StoredToken = JSON.parse(serialized)
      
      // Check if token is expired
      if (token.expires_at && token.expires_at <= Date.now()) {
        await this.remove(key)
        return null
      }
      
      return token
    } catch (error) {
      console.error('Failed to retrieve token from session:', error)
      return null
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const storageKey = this.prefix + key
      sessionStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to remove token from session:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(sessionStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('Failed to clear tokens from session:', error)
    }
  }

  isSupported(): boolean {
    try {
      const test = '__storage_test__'
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}

/**
 * In-memory token storage (for situations where persistent storage is not available)
 */
class MemoryTokenStorage implements TokenStorage {
  private storage = new Map<string, StoredToken>()

  async store(key: string, token: StoredToken): Promise<void> {
    this.storage.set(key, token)
  }

  async retrieve(key: string): Promise<StoredToken | null> {
    const token = this.storage.get(key)
    
    if (!token) return null
    
    // Check if token is expired
    if (token.expires_at && token.expires_at <= Date.now()) {
      await this.remove(key)
      return null
    }
    
    return token
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }

  isSupported(): boolean {
    return true
  }
}

/**
 * Create the appropriate token storage based on environment
 */
export function createTokenStorage(
  type: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage'
): TokenStorage {
  if (typeof window === 'undefined') {
    // Server-side: use memory storage
    return new MemoryTokenStorage()
  }

  switch (type) {
    case 'localStorage':
      return new LocalStorageTokenStorage().isSupported()
        ? new LocalStorageTokenStorage()
        : new MemoryTokenStorage()
    
    case 'sessionStorage':
      return new SessionStorageTokenStorage().isSupported()
        ? new SessionStorageTokenStorage()
        : new MemoryTokenStorage()
    
    case 'memory':
      return new MemoryTokenStorage()
    
    default:
      return new MemoryTokenStorage()
  }
}

/**
 * Default token storage instance
 */
export const tokenStorage = createTokenStorage('localStorage')

/**
 * Secure token manager with encryption capabilities
 * Note: This is a basic implementation. For production, consider using:
 * - Web Crypto API for encryption
 * - Secure key derivation
 * - Token rotation strategies
 */
export class SecureTokenManager {
  private storage: TokenStorage

  constructor(storage?: TokenStorage) {
    this.storage = storage || tokenStorage
  }

  /**
   * Store OAuth2 token securely
   */
  async storeToken(clientId: string, token: Omit<StoredToken, 'created_at' | 'expires_at'>): Promise<void> {
    const secureToken: StoredToken = {
      ...token,
      client_id: clientId,
      created_at: Date.now(),
      expires_at: Date.now() + (token.expires_in * 1000)
    }

    await this.storage.store(clientId, secureToken)
  }

  /**
   * Retrieve OAuth2 token
   */
  async getToken(clientId: string): Promise<StoredToken | null> {
    return await this.storage.retrieve(clientId)
  }

  /**
   * Remove OAuth2 token
   */
  async removeToken(clientId: string): Promise<void> {
    await this.storage.remove(clientId)
  }

  /**
   * Clear all tokens
   */
  async clearAllTokens(): Promise<void> {
    await this.storage.clear()
  }

  /**
   * Check if token exists and is valid
   */
  async isTokenValid(clientId: string): Promise<boolean> {
    const token = await this.getToken(clientId)
    if (!token) return false
    
    return token.expires_at > Date.now()
  }

  /**
   * Get token expiry time
   */
  async getTokenExpiry(clientId: string): Promise<number | null> {
    const token = await this.getToken(clientId)
    return token?.expires_at || null
  }
}

/**
 * Default secure token manager instance
 */
export const secureTokenManager = new SecureTokenManager()

/**
 * Utility functions
 */
export const tokenUtils = {
  /**
   * Format token expiry for display
   */
  formatExpiry(expiresAt: number): string {
    const now = Date.now()
    const diff = expiresAt - now
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day(s)`
    if (hours > 0) return `${hours} hour(s)`
    return `${minutes} minute(s)`
  },

  /**
   * Check if token needs refresh (within threshold)
   */
  needsRefresh(expiresAt: number, threshold: number = 5 * 60 * 1000): boolean {
    return (expiresAt - Date.now()) <= threshold
  },

  /**
   * Validate token structure
   */
  isValidToken(token: unknown): token is StoredToken {
    if (!token || typeof token !== 'object') return false
    
    const t = token as Record<string, unknown>
    return (
      typeof t.access_token === 'string' &&
      typeof t.token_type === 'string' &&
      typeof t.expires_in === 'number' &&
      typeof t.scope === 'string' &&
      typeof t.expires_at === 'number' &&
      typeof t.client_id === 'string' &&
      typeof t.created_at === 'number'
    )
  }
}
