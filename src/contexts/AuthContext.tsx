'use client'

import {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {exchangeFirebaseToken, logoutUser as serviceLogout, refreshToken as serviceRefreshToken, signInWithEmail as serviceSignInWithEmail, register as serviceRegister, verifyTwoFactorLogin, loginTenantContext} from '@/services/authService'
import apiClient from '@/lib/apiClient'
import {SocialTokenExchangeInput, LoginInput, RegisterInput, AuthResult, Verify2FARequest} from '@/types/user'
import {toast} from 'sonner'
import {AuthContextType} from '@/types/auth'
import {AppUser, ContextMode, ContextSwitchOptions, ContextSwitchResult} from '@/types/dual-context'
import {tokenManager} from '@/lib/token-storage'
import {multiTenantTokenManager} from '@/lib/multi-tenant-token-manager'
import {contextManager} from '@/lib/context-manager'
import {decodeJwt} from '@/lib/jwt'
import {clearPermissionsCache} from '@/services/permissionService'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const decodeToken = (token: string): AppUser | null => {
	try {
		const decoded = decodeJwt<{
			sub: string
			email: string
			first_name?: string
			last_name?: string
			avatar?: string
			roles?: string[]
			tenant_id?: string
			exp: number
		}>(token)

		const expiresAt = new Date(decoded.exp * 1000)
		const timeUntilExpiry = decoded.exp * 1000 - Date.now()

		if (timeUntilExpiry <= 0) {
			console.log(`🕰️ Token expired at ${expiresAt.toISOString()}`)
			return null
		}

		console.log(`✅ Token valid until ${expiresAt.toISOString()} (${Math.round(timeUntilExpiry / 1000 / 60)} minutes remaining)`)

		return {
			id: decoded.sub,
			email: decoded.email,
			first_name: decoded.first_name,
			last_name: decoded.last_name,
			avatar: decoded.avatar,
			roles: decoded.roles || [],
			tenant_id: decoded.tenant_id,
		}
	} catch (error) {
		console.error('❌ Failed to decode token:', error)
		return null
	}
}

const REFRESH_MARGIN_MS = 10 * 60 * 1000
const MIN_REFRESH_DELAY_MS = 5 * 1000

export function AuthProvider({children}: {children: React.ReactNode}) {
	// Current active state
	const [user, setUser] = useState<AppUser | null>(null)
	const [isSystemAdmin, setIsSystemAdmin] = useState<boolean | null>(null)
	const [loading, setLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [currentTenantId, setCurrentTenantId] = useState<string | null>(null)
	const [isTwoFactorPending, setIsTwoFactorPending] = useState(false)
	const [twoFactorSessionToken, setTwoFactorSessionToken] = useState<string | null>(null)
	const [isInitialLoad, setIsInitialLoad] = useState(true)

	// Cache for system admin status to prevent spam
	const [adminStatusCache, setAdminStatusCache] = useState<{
		value: boolean | null
		timestamp: number
		contextMode: ContextMode
	}>({value: null, timestamp: 0, contextMode: 'global'})

	// Debounce refs to prevent multiple simultaneous calls
	const adminCheckInProgress = useRef(false)
	const authCheckInProgress = useRef(false)
	const hasInitialAuthCheck = useRef(false) // Track if initial auth check is done

	// Dual context state
	const [currentMode, setCurrentMode] = useState<ContextMode>('global')
	const [globalContext, setGlobalContext] = useState<{
		user: AppUser | null
		isAuthenticated: boolean
		tenantId: string | null
	}>({user: null, isAuthenticated: false, tenantId: null})
	const [tenantContext, setTenantContext] = useState<{
		user: AppUser | null
		isAuthenticated: boolean
		tenantId: string | null
	}>({user: null, isAuthenticated: false, tenantId: null})
	const [isTransitioning, setIsTransitioning] = useState(false)

	const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const scheduleTokenRefreshRef = useRef<((token: string) => void) | null>(null)

	const router = useRouter()

	// Initialize context mode from storage - MUST happen before auth check
	useEffect(() => {
		const storedMode = contextManager.getCurrentMode()
		console.log('🔧 Initializing context mode from storage:', storedMode)
		setCurrentMode(storedMode)
	}, [])

	const clearAuthData = useCallback(
		async (doFirebaseSignOut = true, shouldRedirect = true, context?: ContextMode) => {
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current)
				refreshTimeoutRef.current = null
			}

			const targetContext = context || currentMode

			// If context is 'auto', clear all contexts
			if (context === 'auto') {
				// Clear all tokens and contexts
				tokenManager.clearTokens('global')
				tokenManager.clearTokens('tenant')
				contextManager.clearContextState('global')
				contextManager.clearContextState('tenant')

				// Clear multi-tenant tokens too
				multiTenantTokenManager.clearAllTenantTokens()

				// Clear all permissions cache
				clearPermissionsCache()
			} else {
				// Clear tokens for specific context
				tokenManager.clearTokens(targetContext)
				// Clear context state
				contextManager.clearContextState(targetContext)

				// Clear permissions cache for specific context
				if (targetContext === 'tenant' && currentTenantId) {
					clearPermissionsCache(currentTenantId)
				} else if (targetContext === 'global') {
					clearPermissionsCache() // Clear global permissions
				}
			}

			// Update UI state based on context
			if (context === 'auto' || targetContext === 'global' || targetContext === currentMode) {
				setUser(null)
				setIsAuthenticated(false)
				setIsSystemAdmin(null)
				setCurrentTenantId(null)
				setIsTwoFactorPending(false)
				setTwoFactorSessionToken(null)

				// Clear cookies
				document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
				document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

				delete apiClient.defaults.headers.Authorization
			}

			// Update context states - when 'auto', clear both
			if (context === 'auto') {
				setGlobalContext({user: null, isAuthenticated: false, tenantId: null})
				setTenantContext({user: null, isAuthenticated: false, tenantId: null})
			} else if (targetContext === 'global') {
				setGlobalContext({user: null, isAuthenticated: false, tenantId: null})
			} else if (targetContext === 'tenant') {
				setTenantContext({user: null, isAuthenticated: false, tenantId: null})
			}

			if (doFirebaseSignOut) {
				try {
					await serviceLogout()
				} catch (error) {
					console.warn('Error during service logout on clearAuthData:', error)
				}
			}

			if (shouldRedirect && !isInitialLoad) {
				// Store current path for redirect after login (except for login/register pages)
				const currentPath = window.location.pathname
				if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/auth')) {
					sessionStorage.setItem('auth_redirect_path', currentPath + window.location.search)
				}
				router.push('/login')
			}
		},
		[currentMode, router, isInitialLoad, currentTenantId],
	)

	const checkSystemAdminStatus = useCallback(
		async (context?: ContextMode) => {
			const activeContext = context || currentMode

			// Prevent multiple simultaneous calls
			if (adminCheckInProgress.current) {
				console.log('🔄 Admin check already in progress, skipping')
				return
			}

			// Check cache first (valid for 5 minutes)
			const now = Date.now()
			const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
			if (adminStatusCache.value !== null && adminStatusCache.contextMode === activeContext && now - adminStatusCache.timestamp < CACHE_DURATION) {
				console.log('📦 Using cached admin status:', adminStatusCache.value)
				setIsSystemAdmin(adminStatusCache.value)
				return
			}

			const tokens = tokenManager.getTokens(activeContext)

			if (!tokens.accessToken) {
				setIsSystemAdmin(false)
				setAdminStatusCache({value: false, timestamp: now, contextMode: activeContext})
				return
			}

			adminCheckInProgress.current = true

			try {
				// Temporarily set auth header for this request
				const originalAuth = apiClient.defaults.headers.Authorization
				apiClient.defaults.headers.Authorization = `Bearer ${tokens.accessToken}`

				const response = await apiClient.get<{is_system_admin: boolean}>('/api/v1/auth/me/is-system-admin')
				const isAdmin = response.data.is_system_admin

				setIsSystemAdmin(isAdmin)
				setAdminStatusCache({value: isAdmin, timestamp: now, contextMode: activeContext})

				// Restore original auth header
				if (originalAuth) {
					apiClient.defaults.headers.Authorization = originalAuth
				} else {
					delete apiClient.defaults.headers.Authorization
				}

				console.log('✅ System admin status fetched:', isAdmin)
			} catch (error) {
				console.error('Failed to fetch system admin status:', error)
				setIsSystemAdmin(false)
				setAdminStatusCache({value: false, timestamp: now, contextMode: activeContext})
			} finally {
				adminCheckInProgress.current = false
			}
		},
		[currentMode, adminStatusCache],
	)

	const updateContextState = useCallback((context: ContextMode, user: AppUser | null, isAuth: boolean, tenantId?: string | null) => {
		const tokens = tokenManager.getTokens(context)
		const contextState = {
			user,
			permissions: [],
			roles: user?.roles || [],
			tokens,
			isAuthenticated: isAuth,
			tenantId: tenantId || user?.tenant_id || null,
			lastUpdated: Date.now(),
		}

		contextManager.setContextState(context, contextState)

		if (context === 'global') {
			setGlobalContext({user, isAuthenticated: isAuth, tenantId: tenantId || user?.tenant_id || null})
		} else if (context === 'tenant') {
			setTenantContext({user, isAuthenticated: isAuth, tenantId: tenantId || user?.tenant_id || null})
		}
	}, [])

	const handleAuthSuccessInternal = useCallback(
		async (authResult: AuthResult, preserveContext = false) => {
			// Determine target context based on preserve flag and token content
			let targetContext: ContextMode
			if (preserveContext) {
				// When preserving context, keep current mode
				targetContext = currentMode
				console.log(`🔧 Preserving current context: ${targetContext}`)
			} else {
				// Auto-detect context from token
				const decodedForContext = decodeToken(authResult.access_token)
				targetContext = decodedForContext?.tenant_id ? 'tenant' : 'global'
				console.log(`🎯 Auto-detected context from token: ${targetContext}`)
			}

			// Store tokens in appropriate context
			tokenManager.setTokens(targetContext, authResult.access_token, authResult.refresh_token || null)

			// Set cookies for middleware
			document.cookie = `accessToken=${authResult.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
			if (authResult.refresh_token) {
				document.cookie = `refreshToken=${authResult.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
			}

			// Dispatch custom event to notify components in same tab about token update
			window.dispatchEvent(new CustomEvent('tokenUpdated', {detail: {targetContext}}))

			apiClient.defaults.headers.Authorization = `Bearer ${authResult.access_token}`

			const appUser = decodeToken(authResult.access_token)
			if (appUser) {
				// Update current active state
				setUser(appUser)
				setIsAuthenticated(true)
				setCurrentTenantId(appUser.tenant_id || null)

				// Update context state
				updateContextState(targetContext, appUser, true)

				// Switch to appropriate context if not preserving
				if (!preserveContext) {
					setCurrentMode(targetContext)
					contextManager.setCurrentMode(targetContext)
				}

				await checkSystemAdminStatus(targetContext)
			}

			console.log(`✅ Authentication successful, context: ${targetContext}, state updated (including admin and tenant status).`)

			// Handle OAuth2 redirect logic
			const storedOAuth2Params = sessionStorage.getItem('oauth2_params')
			if (storedOAuth2Params) {
				try {
					const oauth2Params = JSON.parse(storedOAuth2Params)
					sessionStorage.removeItem('oauth2_params')
					const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
					const authUrl = new URL('/api/v1/oauth2/authorize', baseUrl)
					Object.entries(oauth2Params).forEach(([key, value]) => {
						if (typeof value === 'string') {
							authUrl.searchParams.set(key, value)
						}
					})
					window.location.href = authUrl.toString()
					return
				} catch (error) {
					console.error('Error parsing OAuth2 parameters:', error)
					sessionStorage.removeItem('oauth2_params')
				}
			}

			// Add redirect logic for successful login (only if not preserving context)
			if (!preserveContext && appUser) {
				// Check if there's a stored redirect path
				const storedRedirect = sessionStorage.getItem('auth_redirect_path')
				if (storedRedirect) {
					sessionStorage.removeItem('auth_redirect_path')
					// Use setTimeout to ensure state updates are processed first
					setTimeout(() => {
						router.push(storedRedirect)
					}, 100)
				} else {
					// Default redirect to dashboard
					setTimeout(() => {
						router.push('/dashboard/profile')
					}, 100)
				}
			}

			// Return the new access token for external scheduling
			return authResult.access_token
		},
		[currentMode, checkSystemAdminStatus, updateContextState, router],
	)

	// Public wrapper that matches the interface (returns void)
	const handleAuthSuccess = useCallback(
		async (authResult: AuthResult, preserveContext = false) => {
			const newAccessToken = await handleAuthSuccessInternal(authResult, preserveContext)
			
			// Schedule refresh for new logins (not for refreshes)
			if (newAccessToken && scheduleTokenRefreshRef.current) {
				console.log('📅 Scheduling token refresh for new authentication')
				scheduleTokenRefreshRef.current(newAccessToken)
			}
		},
		[handleAuthSuccessInternal],
	)

	// Context switching methods
	const switchToTenant = useCallback(
		async (tenantId: string, options: ContextSwitchOptions = {}): Promise<ContextSwitchResult> => {
			setIsTransitioning(true)
			try {
				// Import loginTenantContext service
				const {loginTenantContext} = await import('@/services/authService')

				// Call login-tenant API to get tenant access token
				const result = await loginTenantContext(
					tenantId,
					options.preserveGlobalContext,
					true, // validateContext
				)

				if (result.success) {
					// Get tenant tokens after login-tenant
					const tenantTokens = tokenManager.getTokens('tenant')
					if (tenantTokens.accessToken) {
						// Decode new tenant token to get user with tenant_id
						const tenantUser = decodeToken(tenantTokens.accessToken)
						if (tenantUser) {
							setCurrentMode('tenant')
							contextManager.setCurrentMode('tenant') // Update context manager
							setUser(tenantUser)
							setIsAuthenticated(true)
							setCurrentTenantId(tenantId)

							// Update API client with tenant token
							apiClient.defaults.headers.Authorization = `Bearer ${tenantTokens.accessToken}`

							// Update context state
							contextManager.setContextState('tenant', {
								user: tenantUser,
								isAuthenticated: true,
								tenantId: tenantId,
								permissions: (tenantUser.roles || []).map((role) => ({
									object: 'tenant',
									action: role,
								})),
								roles: tenantUser.roles || [],
								tokens: tenantTokens,
							})

							toast.success(`Switched to tenant: ${tenantId}`)
						} else {
							throw new Error('Failed to decode tenant token')
						}
					} else {
						throw new Error('No tenant access token received')
					}
				} else {
					toast.error(result.error || 'Failed to switch to tenant context')
				}
				return result
			} catch (error) {
				console.error('Error switching to tenant:', error)
				const errorMessage = error instanceof Error ? error.message : 'Failed to switch to tenant'
				toast.error(errorMessage)
				return {
					success: false,
					previousMode: currentMode,
					newMode: currentMode,
					error: errorMessage,
					rollbackAvailable: false,
				}
			} finally {
				setIsTransitioning(false)
			}
		},
		[currentMode],
	)

	const switchToTenantById = useCallback(async (tenantId: string): Promise<void> => {
		try {
			setLoading(true)

			// Check if we already have valid tokens for this tenant
			const validation = multiTenantTokenManager.validateTenantTokens(tenantId)

			if (validation.isValid) {
				console.log(`✅ Using cached tokens for tenant ${tenantId}`)

				// Switch context using existing tokens
				const tokens = multiTenantTokenManager.getTenantTokens(tenantId)
				tokenManager.setTokens('tenant', tokens.accessToken, tokens.refreshToken)

				// Update context
				setCurrentMode('tenant')
				contextManager.setCurrentMode('tenant') // Update context manager
				setCurrentTenantId(tenantId)

				// Update user from token
				if (tokens.accessToken) {
					const decoded = decodeToken(tokens.accessToken)
					if (decoded) {
						setUser(decoded)
						setIsAuthenticated(true)
					}
				}

				return
			}

			console.log(`🔄 Need to authenticate for tenant ${tenantId}`)

			// Call login-tenant to get new tokens
			const result = await loginTenantContext(tenantId, true, false)

			if (result.success) {
				console.log(`✅ Successfully switched to tenant ${tenantId}`)

				// The tokens are already stored by loginTenantContext
				// Just update the state
				setCurrentMode('tenant')
				contextManager.setCurrentMode('tenant') // Update context manager
				setCurrentTenantId(tenantId)

				// Get and set user from new token
				const tenantTokens = tokenManager.getTokens('tenant')
				if (tenantTokens.accessToken) {
					const decoded = decodeToken(tenantTokens.accessToken)
					if (decoded) {
						setUser(decoded)
						setIsAuthenticated(true)
					}
				}
			} else {
				throw new Error(result.error || 'Failed to switch tenant context')
			}
		} catch (error) {
			console.error('Error switching to tenant:', error)
			toast.error('Failed to switch to tenant context')
			throw error
		} finally {
			setLoading(false)
		}
	}, [])

	const switchToGlobal = useCallback(
		async (options: ContextSwitchOptions = {}): Promise<ContextSwitchResult> => {
			setIsTransitioning(true)
			try {
				// Import loginGlobalContext service
				const {loginGlobalContext} = await import('@/services/authService')

				// Call login-global API to get global access token
				const result = await loginGlobalContext(
					options.preserveGlobalContext,
					true, // validateContext
				)

				if (result.success) {
					// Get global tokens after login-global
					const globalTokens = tokenManager.getTokens('global')
					if (globalTokens.accessToken) {
						// Decode new global token to get user without tenant_id
						const globalUser = decodeToken(globalTokens.accessToken)
						if (globalUser) {
							setCurrentMode('global')
							contextManager.setCurrentMode('global') // Update context manager
							setUser(globalUser)
							setIsAuthenticated(true)
							setCurrentTenantId(null) // Global context has no tenant

							// Update API client with global token
							apiClient.defaults.headers.Authorization = `Bearer ${globalTokens.accessToken}`

							// Update context state
							contextManager.setContextState('global', {
								user: globalUser,
								isAuthenticated: true,
								tenantId: null,
								permissions: (globalUser.roles || []).map((role) => ({
									object: 'global',
									action: role,
								})),
								roles: globalUser.roles || [],
								tokens: globalTokens,
							})

							toast.success('Switched to global context')
						} else {
							throw new Error('Failed to decode global token')
						}
					} else {
						throw new Error('No global access token received')
					}
				} else {
					toast.error(result.error || 'Failed to switch to global context')
				}
				return result
			} catch (error) {
				console.error('Error switching to global:', error)
				const errorMessage = error instanceof Error ? error.message : 'Failed to switch to global'
				toast.error(errorMessage)
				return {
					success: false,
					previousMode: currentMode,
					newMode: currentMode,
					error: errorMessage,
					rollbackAvailable: false,
				}
			} finally {
				setIsTransitioning(false)
			}
		},
		[currentMode],
	)

	const switchContext = useCallback(
		async (mode: ContextMode, tenantId?: string, options: ContextSwitchOptions = {}): Promise<ContextSwitchResult> => {
			if (mode === 'tenant') {
				return switchToTenant(tenantId!, options)
			} else {
				return switchToGlobal(options)
			}
		},
		[switchToTenant, switchToGlobal],
	)

	const rollbackContext = useCallback(async (): Promise<ContextSwitchResult> => {
		setIsTransitioning(true)
		try {
			const result = await contextManager.rollbackContext()
			if (result.success) {
				setCurrentMode(result.newMode)
				toast.success('Context rolled back successfully')
			} else {
				toast.error(result.error || 'Failed to rollback context')
			}
			return result
		} finally {
			setIsTransitioning(false)
		}
	}, [])

	// Utility methods
	const getActiveContext = useCallback((): 'global' | 'tenant' => {
		return currentMode === 'auto' ? (currentTenantId ? 'tenant' : 'global') : currentMode
	}, [currentMode, currentTenantId])

	const canSwitchToTenant = useCallback(
		(tenantId: string): boolean => {
			return contextManager.canSwitchToTenant(tenantId, user || undefined)
		},
		[user],
	)

	// Token refresh logic
	const handleScheduledRefreshInternal = useCallback(async () => {
		console.log('🔄 Attempting scheduled token refresh (internal)...')
		const currentTokens = tokenManager.getTokens(currentMode)

		if (!currentTokens.refreshToken) {
			console.log('❌ No refresh token available for scheduled refresh.')
			await clearAuthData()
			return
		}

		try {
			const refreshResponse = await serviceRefreshToken(currentTokens.refreshToken)
			// Handle the auth success and get the new token for rescheduling
			const newAccessToken = await handleAuthSuccessInternal(refreshResponse.auth, true) // preserveContext=true
			console.log('✅ Scheduled token refresh successful.')
			
			// Schedule the next refresh for the new token
			if (newAccessToken && scheduleTokenRefreshRef.current) {
				console.log('📅 Scheduling next token refresh for refreshed token')
				scheduleTokenRefreshRef.current(newAccessToken)
			}
		} catch (error) {
			console.error('❌ Scheduled token refresh failed:', error)
			toast.error('Session expired. Please log in again.')
			await clearAuthData()
		}
	}, [currentMode, handleAuthSuccessInternal, clearAuthData])

	const scheduleTokenRefreshInternal = useCallback(
		(currentToken: string) => {
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current)
			}
			try {
				const decoded = decodeJwt<{exp: number}>(currentToken)
				const expiresInMs = decoded.exp * 1000 - Date.now()
				let refreshDelay = expiresInMs - REFRESH_MARGIN_MS
				if (refreshDelay < MIN_REFRESH_DELAY_MS) {
					refreshDelay = MIN_REFRESH_DELAY_MS
				}
				console.log(`Scheduling token refresh in ${refreshDelay / 1000 / 60} minutes.`)
				refreshTimeoutRef.current = setTimeout(handleScheduledRefreshInternal, refreshDelay)
			} catch (error) {
				console.error('Failed to decode token for scheduling refresh:', error)
			}
		},
		[handleScheduledRefreshInternal],
	)

	scheduleTokenRefreshRef.current = scheduleTokenRefreshInternal

	const checkAuthStatus = useCallback(async () => {
		// Prevent multiple simultaneous auth checks
		if (authCheckInProgress.current) {
			console.log('🔄 Auth check already in progress, skipping')
			return
		}

		authCheckInProgress.current = true
		setLoading(true)

		try {
			// Ensure we have the correct context mode before checking tokens
			const actualMode = contextManager.getCurrentMode()
			if (actualMode !== currentMode) {
				console.log(`🔧 Context mode mismatch detected. Stored: ${actualMode}, Current: ${currentMode}. Updating...`)
				setCurrentMode(actualMode)
			}

			const currentTokens = tokenManager.getTokens(actualMode)
			// console.log(`🔍 Checking auth status for context: ${actualMode}`, {
			// 	hasAccessToken: !!currentTokens.accessToken,
			// 	hasRefreshToken: !!currentTokens.refreshToken,
			// })

			// Debug token information
			if (process.env.NODE_ENV === 'development') {
				// logTokenDebugInfo()
			}

			if (currentTokens.accessToken) {
				// First, check if token is structurally valid (can be decoded)
				let decodedUser: AppUser | null = null
				let isTokenExpired = false

				try {
					decodedUser = decodeToken(currentTokens.accessToken)
					isTokenExpired = !decodedUser // decodeToken returns null if expired
				} catch (error) {
					console.log('❌ Token decode failed:', error)
					isTokenExpired = true
				}

				// If token is expired but we have refresh token, try to refresh first
				if (isTokenExpired && currentTokens.refreshToken) {
					console.log('🔄 Access token expired, attempting refresh...')
					try {
						const refreshResponse = await serviceRefreshToken(currentTokens.refreshToken)
						await handleAuthSuccessInternal(refreshResponse.auth, true)
						console.log('✅ User authenticated after token refresh.')
						return // Exit early, handleAuthSuccessInternal will update all state
					} catch (refreshError) {
						console.error('❌ Token refresh failed:', refreshError)
						await clearAuthData(true, false)
						return
					}
				}

				// If we have a valid decoded user, proceed with authentication
				if (decodedUser) {
					apiClient.defaults.headers.Authorization = `Bearer ${currentTokens.accessToken}`
					document.cookie = `accessToken=${currentTokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
					if (currentTokens.refreshToken) {
						document.cookie = `refreshToken=${currentTokens.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
					}

					setUser(decodedUser)
					setIsAuthenticated(true)
					setCurrentTenantId(decodedUser.tenant_id || null)

					// Update context state
					updateContextState(actualMode, decodedUser, true)

					await checkSystemAdminStatus(actualMode)
					console.log('✅ User authenticated from stored access token.')

					if (scheduleTokenRefreshRef.current) {
						scheduleTokenRefreshRef.current(currentTokens.accessToken)
					}
				} else {
					// Token is invalid and no refresh token available
					console.log('❌ Access token invalid and no refresh token available.')
					await clearAuthData(true, false)
				}
			} else {
				console.log('ℹ️ No stored access token.')
				setIsAuthenticated(false)
				setUser(null)
				setIsSystemAdmin(null)
				setCurrentTenantId(null)
			}
		} catch (error) {
			console.error('❌ Error checking auth status:', error)
			setIsAuthenticated(false)
			setUser(null)
			setIsSystemAdmin(null)
			setCurrentTenantId(null)
		} finally {
			setLoading(false)
			setIsInitialLoad(false)
			authCheckInProgress.current = false
			hasInitialAuthCheck.current = true // Mark initial check as done
		}
	}, [currentMode, handleAuthSuccessInternal, clearAuthData, checkSystemAdminStatus, updateContextState]) // Keep original dependencies

	// Check auth status only after context mode is initialized
	useEffect(() => {
		// Only check auth status after initial context mode is set and not already checked
		if (currentMode && !hasInitialAuthCheck.current && !authCheckInProgress.current) {
			console.log('🔄 Initial auth check for mode:', currentMode)
			checkAuthStatus()
		}
	}, [checkAuthStatus, currentMode]) // Keep checkAuthStatus but use ref to control execution

	// Listen for storage changes to detect token updates from other tabs or after login
	useEffect(() => {
		let storageChangeTimeout: NodeJS.Timeout | null = null

		const handleStorageChange = (e: StorageEvent) => {
			// Check if the changed key is related to tokens or context
			if (e.key && (e.key.includes('accessToken') || e.key.includes('refreshToken') || e.key.includes('auth3_') || e.key.includes('dual_context_'))) {
				console.log('🔄 Token/context storage changed, re-checking auth status:', e.key)

				// Clear existing timeout to debounce multiple rapid storage changes
				if (storageChangeTimeout) {
					clearTimeout(storageChangeTimeout)
				}

				// Debounce storage changes with 300ms delay
				storageChangeTimeout = setTimeout(() => {
					checkAuthStatus()
					storageChangeTimeout = null
				}, 300)
			}
		}

		// Add event listener for storage changes
		window.addEventListener('storage', handleStorageChange)

		// Also listen for custom events for same-tab token updates
		const handleTokenUpdate = (event: Event) => {
			const customEvent = event as CustomEvent
			console.log('🔄 Token updated in same tab, re-checking auth status:', customEvent.detail)

			// Clear existing timeout to debounce multiple rapid custom events
			if (storageChangeTimeout) {
				clearTimeout(storageChangeTimeout)
			}

			// Use same debounce mechanism for consistency
			storageChangeTimeout = setTimeout(() => {
				checkAuthStatus()
				storageChangeTimeout = null
			}, 300)
		}

		window.addEventListener('tokenUpdated', handleTokenUpdate)

		return () => {
			// Clean up timeout if component unmounts
			if (storageChangeTimeout) {
				clearTimeout(storageChangeTimeout)
			}
			window.removeEventListener('storage', handleStorageChange)
			window.removeEventListener('tokenUpdated', handleTokenUpdate)
		}
	}, [checkAuthStatus])

	// Social login methods (unchanged logic, but now context-aware)
	const signInWithGoogle = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new GoogleAuthProvider()
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = {provider: 'google', id_token: idToken}
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccess(response.auth)
			toast.success('Successfully signed in with Google!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Google sign-in failed.'
			toast.error(`Google sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccess])

	const signInWithFacebook = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new FacebookAuthProvider()
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = {provider: 'facebook', id_token: idToken}
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccess(response.auth)
			toast.success('Successfully signed in with Facebook!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Facebook sign-in failed.'
			toast.error(`Facebook sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccess])

	const signInWithApple = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new OAuthProvider('apple.com')
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = {provider: 'apple', id_token: idToken}
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccess(response.auth)
			toast.success('Successfully signed in with Apple!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Apple sign-in failed.'
			toast.error(`Apple sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccess])

	const signInWithTwitter = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new OAuthProvider('twitter.com')
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = {provider: 'twitter', id_token: idToken}
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccess(response.auth)
			toast.success('Successfully signed in with Twitter!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Twitter sign-in failed.'
			toast.error(`Twitter sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccess])

	const signInWithEmail = useCallback(
		async (data: LoginInput) => {
			setLoading(true)
			try {
				const response = await serviceSignInWithEmail(data)
				if (response.two_factor_required) {
					setIsTwoFactorPending(true)
					setTwoFactorSessionToken(response.two_factor_session_token || null)
					setLoading(false)
					return {success: true, twoFactorRequired: true, sessionToken: response.two_factor_session_token}
				} else if (response.auth) {
					await handleAuthSuccess(response.auth)
					toast.success('Successfully signed in!')
					return {success: true, twoFactorRequired: false}
				} else {
					throw new Error('Invalid response from server')
				}
			} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : 'Email sign-in failed.'
				toast.error(`Sign-in failed: ${msg}`)
				setLoading(false)
				return {success: false, twoFactorRequired: false, error}
			}
		},
		[handleAuthSuccess],
	)

	const verifyTwoFactorCode = useCallback(
		async (data: Verify2FARequest) => {
			setLoading(true)
			try {
				if (!twoFactorSessionToken) {
					throw new Error('No 2FA session token available')
				}
				const response = await verifyTwoFactorLogin({...data, two_factor_session_token: twoFactorSessionToken})
				if (response.auth) {
					await handleAuthSuccess(response.auth)
					setIsTwoFactorPending(false)
					setTwoFactorSessionToken(null)
					toast.success('Successfully verified 2FA!')
					return {success: true}
				} else {
					throw new Error('Invalid 2FA response')
				}
			} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : 'Invalid 2FA code or session expired.'
				toast.error(`2FA verification failed: ${msg}`)
				setIsTwoFactorPending(false)
				setTwoFactorSessionToken(null)
				return {success: false, error}
			} finally {
				setLoading(false)
			}
		},
		[twoFactorSessionToken, handleAuthSuccess],
	)

	const register = useCallback(async (data: RegisterInput) => {
		setLoading(true)
		try {
			await serviceRegister(data)
			toast.success('Successfully registered!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Registration failed.'
			toast.error(`Registration failed: ${msg}`)
			setIsAuthenticated(false)
			setUser(null)
			setIsSystemAdmin(null)
			throw error
		} finally {
			setLoading(false)
		}
	}, [])

	const logout = useCallback(async () => {
		setLoading(true)

		// Check if currently in tenant space and redirect to avoid issues after login
		if (typeof window !== 'undefined') {
			const currentPath = window.location.pathname
			if (currentPath.includes('/dashboard/tenant/') && !currentPath.includes('/tenant-management')) {
				console.log('🔄 Logout from tenant space, will redirect to main dashboard')
				// Clear all auth data and contexts - use 'auto' to clear everything
				await clearAuthData(true, true, 'auto') // firebase signout, redirect, clear all contexts
				setLoading(false)
				return
			}
		}

		// Normal logout - clear all contexts
		await clearAuthData(true, true, 'auto')
		setLoading(false)
		toast.success('Successfully signed out.')
	}, [clearAuthData])

	const signInWithOAuth2Code = useCallback(
		async (code: string, state?: string | null) => {
			setLoading(true)
			try {
				const codeVerifier = sessionStorage.getItem('oauth2_code_verifier')
				const tokenData = {
					grant_type: 'authorization_code',
					code,
					client_id: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID || 'public-client',
					redirect_uri: process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI || 'http://localhost:3000/auth/callback',
					...(codeVerifier && {code_verifier: codeVerifier}),
					...(state && {state}),
				}

				const response = await apiClient.post<{access_token: string; refresh_token?: string}>('/api/v1/oauth2/token', tokenData, {
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					transformRequest: [
						(data) => {
							return Object.keys(data)
								.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
								.join('&')
						},
					],
				})

				const {access_token, refresh_token} = response.data
				if (!access_token) {
					throw new Error('No access token received')
				}

				sessionStorage.removeItem('oauth2_code_verifier')
				sessionStorage.removeItem('oauth2_code_challenge')

				await handleAuthSuccess({access_token, refresh_token})
				toast.success('Successfully authenticated!')
			} catch (error) {
				console.error('OAuth2 code exchange failed:', error)
				sessionStorage.removeItem('oauth2_code_verifier')
				sessionStorage.removeItem('oauth2_code_challenge')
				throw error
			} finally {
				setLoading(false)
			}
		},
		[handleAuthSuccess],
	)

	/**
	 * Signs in user with DID authentication tokens
	 * @param data DID authentication data including tokens
	 */
	const signInWithDID = useCallback(
		async (data: {did: string; access_token: string; refresh_token: string}) => {
			try {
				setLoading(true)

				// Handle authentication success with DID tokens
				await handleAuthSuccess({
					access_token: data.access_token,
					refresh_token: data.refresh_token,
				})

				toast.success(`Successfully authenticated with DID: ${data.did}`)
			} catch (error) {
				console.error('DID authentication failed:', error)
				toast.error('DID authentication failed')
				throw error
			} finally {
				setLoading(false)
			}
		},
		[handleAuthSuccess],
	)

	const value: AuthContextType = {
		// Current state
		user,
		isAuthenticated,
		isSystemAdmin,
		loading,
		currentTenantId,

		// Dual context state
		currentMode,
		globalContext,
		tenantContext,
		isTransitioning,

		// Authentication methods
		signInWithGoogle,
		signInWithFacebook,
		signInWithApple,
		signInWithTwitter,
		signInWithEmail,
		signInWithDID,
		verifyTwoFactorCode,
		register,
		logout,

		// Context switching
		switchToTenant,
		switchToTenantById,
		switchToGlobal,
		switchContext,

		// Two-factor
		isTwoFactorPending,
		twoFactorSessionToken,

		// Enhanced methods
		handleAuthSuccess: handleAuthSuccess,
		signInWithOAuth2Code,

		// Utilities
		getActiveContext,
		canSwitchToTenant,
		rollbackContext,
		checkAuthStatus,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
