'use client'

import { useState, useEffect } from 'react'

/**
 * Authentication hook
 * 
 * Provides authentication state and user information
 * This is a simplified implementation - in a real app, this would
 * integrate with your actual authentication system
 */

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  avatar?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

// Mock user data - replace with actual authentication logic
const MOCK_USER: User = {
  id: '1',
  email: 'admin@auth3.com',
  name: 'Admin User',
  role: 'admin'
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = async () => {
      try {
        // In a real app, this would check tokens, make API calls, etc.
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // For demo purposes, always return the mock user
        setUser(MOCK_USER)
      } catch (error) {
        console.error('Authentication check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }
}