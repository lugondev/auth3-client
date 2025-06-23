'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCurrentUser } from '@/services/userService'
import { tokenManager } from '@/lib/token-storage'
import { contextManager } from '@/lib/context-manager'
import { UserOutput } from '@/types/user'
import { JWTPayload } from '@/types/jwt'
import { decodeJwt } from '@/lib/jwt'
import { ContextMode } from '@/types/dual-context'

/**
 * Authentication hook
 * 
 * Provides authentication state and user information
 * Connects to real backend authentication system
 */

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  avatar?: string
  firstName?: string
  lastName?: string
  roles?: string[]
  status?: string
  isEmailVerified?: boolean
  isPhoneVerified?: boolean
  isTwoFactorEnabled?: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  contextMode: 'global' | 'tenant'
  tenantId?: string
}

/**
 * Transform UserOutput from backend to frontend User interface
 */
const transformUser = (userOutput: UserOutput): User => {
  return {
    id: userOutput.id,
    email: userOutput.email,
    name: `${userOutput.first_name} ${userOutput.last_name}`.trim(),
    firstName: userOutput.first_name,
    lastName: userOutput.last_name,
    avatar: userOutput.avatar,
    roles: userOutput.roles,
    role: userOutput.roles?.includes('admin') ? 'admin' : 'user',
    status: userOutput.status,
    isEmailVerified: userOutput.is_email_verified,
    isPhoneVerified: userOutput.is_phone_verified,
    isTwoFactorEnabled: userOutput.is_two_factor_enabled
  }
}

/**
 * Extract user info from JWT token
 */
const getUserFromToken = (accessToken: string): Partial<User> | null => {
  try {
    const payload = decodeJwt<JWTPayload>(accessToken)
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      role: payload.roles?.includes('admin') ? 'admin' : 'user'
    }
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [contextMode, setContextMode] = useState<ContextMode>('global')
  const [tenantId, setTenantId] = useState<string | undefined>()

  /**
   * Load user data from backend
   */
  const loadUserData = useCallback(async (): Promise<User | null> => {
    try {
      const userOutput = await getCurrentUser()
      return transformUser(userOutput)
    } catch (error) {
      console.error('Failed to load current user:', error)
      return null
    }
  }, [])

  /**
   * Check authentication status and load user data
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)

      // Get current context mode
      const currentMode = contextManager.getCurrentMode()
      setContextMode(currentMode)

      // Check for valid tokens in current context
      const tokens = tokenManager.getTokens(currentMode)

      if (!tokens.accessToken) {
        setUser(null)
        return
      }

      // Validate token and extract basic user info
      const tokenUser = getUserFromToken(tokens.accessToken)
      if (!tokenUser || !tokenUser.id) {
        // Token is invalid, clear it
        tokenManager.clearTokens(currentMode)
        setUser(null)
        return
      }

      // Extract tenant ID from token if available
      try {
        const payload = decodeJwt<JWTPayload>(tokens.accessToken)
        setTenantId(payload.tenant_id)
      } catch (error) {
        console.error('Error extracting tenant ID from token:', error)
      }

      // Load full user profile from backend
      const fullUser = await loadUserData()
      if (fullUser) {
        setUser(fullUser)
      } else {
        // Failed to load user profile, but token was valid
        // Use basic info from token
        setUser({
          id: tokenUser.id,
          email: tokenUser.email || '',
          name: tokenUser.email?.split('@')[0] || 'User',
          role: tokenUser.role || 'user',
          roles: tokenUser.roles
        })
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      // Clear invalid tokens
      const currentMode = contextManager.getCurrentMode()
      tokenManager.clearTokens(currentMode)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [loadUserData])

  /**
   * Handle logout
   */
  const logout = useCallback(() => {
    const currentMode = contextManager.getCurrentMode()
    tokenManager.clearTokens(currentMode)
    contextManager.clearAllContexts()
    setUser(null)
    setContextMode('global')
    setTenantId(undefined)
  }, [])

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    const refreshedUser = await loadUserData()
    if (refreshedUser) {
      setUser(refreshedUser)
    }
  }, [loadUserData])

  // Initialize authentication check on mount
  useEffect(() => {
    checkAuth()

    // Listen for token changes (e.g., from other tabs)
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [checkAuth])

  // Listen for context changes
  useEffect(() => {
    const handleContextChange = () => {
      const currentMode = contextManager.getCurrentMode()
      setContextMode(currentMode)
      checkAuth() // Re-check auth when context changes
    }

    window.addEventListener('contextChange', handleContextChange)
    return () => {
      window.removeEventListener('contextChange', handleContextChange)
    }
  }, [checkAuth])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.roles?.includes('admin') || false,
    contextMode,
    tenantId,
    // Expose utility functions for components that need them
    logout,
    refreshUser,
    checkAuth
  } as AuthState & {
    logout: () => void
    refreshUser: () => Promise<void>
    checkAuth: () => Promise<void>
  }
}