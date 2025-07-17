'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { refreshAccessToken } from '@/services/oauth2Service'

export interface OAuth2Token {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
  expires_at?: number
}

export interface UseOAuth2TokenOptions {
  clientId: string
  clientSecret?: string
  autoRefresh?: boolean
  refreshThreshold?: number // seconds before expiry to refresh
  onTokenRefreshed?: (token: OAuth2Token) => void
  onTokenExpired?: () => void
  onError?: (error: Error) => void
}

export interface UseOAuth2TokenReturn {
  token: OAuth2Token | null
  isTokenValid: boolean
  isRefreshing: boolean
  refreshToken: () => Promise<OAuth2Token | null>
  setToken: (token: OAuth2Token | null) => void
  clearToken: () => void
  error: Error | null
}

const TOKEN_STORAGE_KEY = 'oauth2_token'

export const useOAuth2Token = (options: UseOAuth2TokenOptions): UseOAuth2TokenReturn => {
  const [token, setTokenState] = useState<OAuth2Token | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  const {
    clientId,
    clientSecret,
    autoRefresh = true,
    refreshThreshold = 60, // 1 minute before expiry
    onTokenRefreshed,
    onTokenExpired,
    onError
  } = options

  // Load token from localStorage on mount
  useEffect(() => {
    const loadStoredToken = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (storedToken) {
          const parsedToken: OAuth2Token = JSON.parse(storedToken)
          
          // Add expires_at if not present
          if (!parsedToken.expires_at && parsedToken.expires_in) {
            parsedToken.expires_at = Date.now() + (parsedToken.expires_in * 1000)
          }
          
          setTokenState(parsedToken)
        }
      } catch (err) {
        console.error('Failed to load stored OAuth2 token:', err)
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    }

    loadStoredToken()
  }, [])

  // Store token in localStorage whenever it changes
  const setToken = useCallback((newToken: OAuth2Token | null) => {
    setTokenState(newToken)
    
    if (newToken) {
      // Add expires_at timestamp
      const tokenWithExpiry = {
        ...newToken,
        expires_at: Date.now() + (newToken.expires_in * 1000)
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenWithExpiry))
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }, [])

  // Clear token
  const clearToken = useCallback(() => {
    setToken(null)
    setError(null)
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
  }, [setToken])

  // Check if token is valid (not expired)
  const isTokenValid = useCallback((currentToken?: OAuth2Token | null): boolean => {
    const tokenToCheck = currentToken || token
    if (!tokenToCheck || !tokenToCheck.expires_at) return false
    
    return tokenToCheck.expires_at > Date.now()
  }, [token])

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<OAuth2Token | null> => {
    if (!token?.refresh_token) {
      const error = new Error('No refresh token available')
      setError(error)
      onError?.(error)
      return null
    }

    setIsRefreshing(true)
    setError(null)

    try {
      const newToken = await refreshAccessToken(
        token.refresh_token,
        clientId,
        clientSecret
      )

      const updatedToken: OAuth2Token = {
        access_token: newToken.access_token,
        token_type: newToken.token_type,
        expires_in: newToken.expires_in,
        scope: newToken.scope || token.scope || '',
        refresh_token: newToken.refresh_token || token.refresh_token // Keep old refresh token if not provided
      }

      setToken(updatedToken)
      onTokenRefreshed?.(updatedToken)
      
      return updatedToken
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Token refresh failed')
      setError(error)
      onError?.(error)
      
      // If refresh fails, clear the token
      clearToken()
      return null
    } finally {
      setIsRefreshing(false)
    }
  }, [token, clientId, clientSecret, setToken, onTokenRefreshed, onError, clearToken])

  // Auto refresh logic
  useEffect(() => {
    if (!autoRefresh || !token || !token.refresh_token) return

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      if (!token.expires_at) return

      const timeUntilExpiry = token.expires_at - Date.now()
      const timeUntilRefresh = Math.max(0, timeUntilExpiry - (refreshThreshold * 1000))

      if (timeUntilRefresh <= 0) {
        // Token is about to expire or already expired
        if (isTokenValid(token)) {
          refreshToken()
        } else {
          onTokenExpired?.()
          clearToken()
        }
      } else {
        // Schedule refresh
        refreshTimeoutRef.current = setTimeout(() => {
          refreshToken()
        }, timeUntilRefresh)
      }
    }

    scheduleRefresh()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [token, autoRefresh, refreshThreshold, refreshToken, isTokenValid, onTokenExpired, clearToken])

  return {
    token,
    isTokenValid: isTokenValid(),
    isRefreshing,
    refreshToken,
    setToken,
    clearToken,
    error
  }
}
