'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Custom hook to listen for token changes and automatically re-check auth status
 * This is useful for components that need to react to authentication state changes
 * from other tabs or after login/logout events
 */
export const useTokenListener = () => {
	const { checkAuthStatus } = useAuth()

	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			// Check if the changed key is related to tokens
			if (e.key && (e.key.includes('accessToken') || e.key.includes('refreshToken') || e.key.includes('auth3_'))) {
				console.log('Token storage changed from another tab, re-checking auth status')
				checkAuthStatus()
			}
		}

		const handleTokenUpdate = () => {
			console.log('Token updated in current tab, re-checking auth status')
			checkAuthStatus()
		}

		// Listen for storage changes from other tabs
		window.addEventListener('storage', handleStorageChange)
		// Listen for custom events from same tab
		window.addEventListener('tokenUpdated', handleTokenUpdate)

		return () => {
			window.removeEventListener('storage', handleStorageChange)
			window.removeEventListener('tokenUpdated', handleTokenUpdate)
		}
	}, [checkAuthStatus])
}

/**
 * Hook that combines authentication state with automatic token listening
 * Use this in components that need to react to auth changes
 */
export const useAuthWithTokenListener = () => {
	const auth = useAuth()
	useTokenListener()
	return auth
}