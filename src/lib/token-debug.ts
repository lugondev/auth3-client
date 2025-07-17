// Token Debug Utilities
// Helps debug token storage and lifecycle issues

import { tokenManager } from './token-storage'
import { contextManager } from './context-manager'
import { decodeJwt } from './jwt'
import { ContextMode } from '@/types/dual-context'

interface TokenDebugInfo {
	context: ContextMode
	hasAccessToken: boolean
	hasRefreshToken: boolean
	accessTokenExpiry?: string
	refreshTokenExpiry?: string
	accessTokenTimeRemaining?: number
	refreshTokenTimeRemaining?: number
	isAccessTokenValid: boolean
	isRefreshTokenValid: boolean
	userInfo?: {
		id: string
		email: string
		tenant_id?: string
		roles: string[]
	}
}

interface FullDebugInfo {
	currentMode: ContextMode
	contexts: {
		global: TokenDebugInfo
		tenant: TokenDebugInfo
	}
	localStorage: {
		keys: string[]
		contextMode: string | null
	}
}

export const debugTokens = (): FullDebugInfo => {
	const currentMode = contextManager.getCurrentMode()

	const debugContext = (context: ContextMode): TokenDebugInfo => {
		const tokens = tokenManager.getTokens(context)
		const info: TokenDebugInfo = {
			context,
			hasAccessToken: !!tokens.accessToken,
			hasRefreshToken: !!tokens.refreshToken,
			isAccessTokenValid: false,
			isRefreshTokenValid: false
		}

		if (tokens.accessToken) {
			try {
				const decoded = decodeJwt<{ exp: number; sub: string; email: string; tenant_id?: string; roles?: string[] }>(tokens.accessToken)
				const expiry = new Date(decoded.exp * 1000)
				const timeRemaining = decoded.exp * 1000 - Date.now()

				info.accessTokenExpiry = expiry.toISOString()
				info.accessTokenTimeRemaining = timeRemaining
				info.isAccessTokenValid = timeRemaining > 0
				info.userInfo = {
					id: decoded.sub,
					email: decoded.email,
					tenant_id: decoded.tenant_id,
					roles: decoded.roles || []
				}
			} catch (error) {
				console.error(`Failed to decode ${context} access token:`, error)
			}
		}

		if (tokens.refreshToken) {
			try {
				const decoded = decodeJwt<{ exp: number }>(tokens.refreshToken)
				const expiry = new Date(decoded.exp * 1000)
				const timeRemaining = decoded.exp * 1000 - Date.now()

				info.refreshTokenExpiry = expiry.toISOString()
				info.refreshTokenTimeRemaining = timeRemaining
				info.isRefreshTokenValid = timeRemaining > 0
			} catch {
				// Refresh tokens might not be JWTs, this is fine
				info.isRefreshTokenValid = true // Assume valid if we can't decode
			}
		}

		return info
	}

	const localStorageKeys = typeof window !== 'undefined'
		? Object.keys(localStorage).filter(key =>
			key.includes('token') ||
			key.includes('auth') ||
			key.includes('context') ||
			key.includes('dual_')
		)
		: []

	return {
		currentMode,
		contexts: {
			global: debugContext('global'),
			tenant: debugContext('tenant')
		},
		localStorage: {
			keys: localStorageKeys,
			contextMode: typeof window !== 'undefined' ? localStorage.getItem('dual_context_current_mode') : null
		}
	}
}

export const logTokenDebugInfo = (): void => {
	const info = debugTokens()

	console.group('🔍 Token Debug Information')
	console.log('Current Mode:', info.currentMode)

	console.group('📁 Global Context')
	const global = info.contexts.global
	console.log('Has Access Token:', global.hasAccessToken)
	console.log('Has Refresh Token:', global.hasRefreshToken)
	console.log('Access Token Valid:', global.isAccessTokenValid)
	console.log('Refresh Token Valid:', global.isRefreshTokenValid)
	if (global.accessTokenExpiry) {
		console.log('Access Token Expires:', global.accessTokenExpiry)
		console.log('Time Remaining (min):', Math.round((global.accessTokenTimeRemaining || 0) / 1000 / 60))
	}
	if (global.userInfo) {
		console.log('User Info:', global.userInfo)
	}
	console.groupEnd()

	console.group('🏢 Tenant Context')
	const tenant = info.contexts.tenant
	console.log('Has Access Token:', tenant.hasAccessToken)
	console.log('Has Refresh Token:', tenant.hasRefreshToken)
	console.log('Access Token Valid:', tenant.isAccessTokenValid)
	console.log('Refresh Token Valid:', tenant.isRefreshTokenValid)
	if (tenant.accessTokenExpiry) {
		console.log('Access Token Expires:', tenant.accessTokenExpiry)
		console.log('Time Remaining (min):', Math.round((tenant.accessTokenTimeRemaining || 0) / 1000 / 60))
	}
	if (tenant.userInfo) {
		console.log('User Info:', tenant.userInfo)
	}
	console.groupEnd()

	console.group('💾 LocalStorage')
	console.log('Context Mode in Storage:', info.localStorage.contextMode)
	console.log('Auth-related Keys:', info.localStorage.keys)
	console.groupEnd()

	console.groupEnd()
}

// Helper to clear everything for debugging
export const clearAllAuthData = (): void => {
	console.log('🧹 Clearing all auth data for debugging...')

	// Clear tokens
	tokenManager.clearTokens('global')
	tokenManager.clearTokens('tenant')

	// Clear context states
	contextManager.clearContextState('global')
	contextManager.clearContextState('tenant')

	// Clear any other auth-related localStorage keys
	if (typeof window !== 'undefined') {
		const keysToRemove = Object.keys(localStorage).filter(key =>
			key.includes('token') ||
			key.includes('auth') ||
			key.includes('context') ||
			key.includes('dual_') ||
			key.includes('oauth2_')
		)

		keysToRemove.forEach(key => {
			localStorage.removeItem(key)
			console.log('Removed:', key)
		})
	}

	// Clear cookies
	document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
	document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

	console.log('✅ All auth data cleared')
}

// Add to window for debugging in browser console
if (typeof window !== 'undefined') {
	const win = window as typeof window & {
		debugAuth: {
			debugTokens: typeof debugTokens
			logTokenDebugInfo: typeof logTokenDebugInfo
			clearAllAuthData: typeof clearAllAuthData
		}
	}

	win.debugAuth = {
		debugTokens,
		logTokenDebugInfo,
		clearAllAuthData
	}
}
