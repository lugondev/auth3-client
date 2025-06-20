'use client'

import {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {useLocalStorage} from 'usehooks-ts'
import {exchangeFirebaseToken, logoutUser as serviceLogout, refreshToken as serviceRefreshToken, signInWithEmail as serviceSignInWithEmail, register as serviceRegister, verifyTwoFactorLogin} from '@/services/authService'
import apiClient from '@/lib/apiClient'
import {jwtDecode} from 'jwt-decode'
import {SocialTokenExchangeInput, LoginInput, RegisterInput, AuthResult, LoginOutput, Verify2FARequest} from '@/types/user'
import {toast} from 'sonner'
import { AuthContextType } from '@/types/auth'
import { AppUser, ContextMode, ContextSwitchOptions, ContextSwitchResult } from '@/types/dual-context'
import { tokenManager } from '@/lib/token-storage'
import { contextManager } from '@/lib/context-manager'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const decodeToken = (token: string): AppUser | null => {
	try {
		const decoded = jwtDecode<{
			sub: string
			email: string
			first_name?: string
			last_name?: string
			avatar?: string
			roles?: string[]
			tenant_id?: string
			exp: number
		}>(token)

		if (decoded.exp * 1000 < Date.now()) {
			console.log('Token expired')
			return null
		}
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
		console.error('Failed to decode token:', error)
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
	
	// Dual context state
	const [currentMode, setCurrentMode] = useState<ContextMode>('global')
	const [globalContext, setGlobalContext] = useState<{
		user: AppUser | null
		isAuthenticated: boolean
		tenantId: string | null
	}>({ user: null, isAuthenticated: false, tenantId: null })
	const [tenantContext, setTenantContext] = useState<{
		user: AppUser | null
		isAuthenticated: boolean
		tenantId: string | null
	}>({ user: null, isAuthenticated: false, tenantId: null })
	const [isTransitioning, setIsTransitioning] = useState(false)
	
	const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const scheduleTokenRefreshRef = useRef<((token: string) => void) | null>(null)

	const router = useRouter()

	// Initialize context mode from storage
	useEffect(() => {
		const storedMode = contextManager.getCurrentMode()
		setCurrentMode(storedMode)
	}, [])

	const clearAuthData = useCallback(
		async (doFirebaseSignOut = true, shouldRedirect = true, context?: ContextMode) => {
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current)
				refreshTimeoutRef.current = null
			}
			
			const targetContext = context || currentMode
			
			// Clear tokens for specific context
			tokenManager.clearTokens(targetContext)
			
			// Clear context state
			contextManager.clearContextState(targetContext)
			
			// Update UI state based on context
			if (targetContext === 'global' || targetContext === currentMode) {
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
			
			// Update context states
			if (targetContext === 'global') {
				setGlobalContext({ user: null, isAuthenticated: false, tenantId: null })
			} else if (targetContext === 'tenant') {
				setTenantContext({ user: null, isAuthenticated: false, tenantId: null })
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
		[currentMode, router, isInitialLoad],
	)

	const checkSystemAdminStatus = useCallback(async (context?: ContextMode) => {
		const activeContext = context || currentMode
		const tokens = tokenManager.getTokens(activeContext)
		
		if (!tokens.accessToken) {
			setIsSystemAdmin(false)
			return
		}
		
		try {
			// Temporarily set auth header for this request
			const originalAuth = apiClient.defaults.headers.Authorization
			apiClient.defaults.headers.Authorization = `Bearer ${tokens.accessToken}`
			
			const response = await apiClient.get<{is_system_admin: boolean}>('/api/v1/auth/me/is-system-admin')
			setIsSystemAdmin(response.data.is_system_admin)
			
			// Restore original auth header
			if (originalAuth) {
				apiClient.defaults.headers.Authorization = originalAuth
			} else {
				delete apiClient.defaults.headers.Authorization
			}
			
			console.log('System admin status fetched:', response.data.is_system_admin)
		} catch (error) {
			console.error('Failed to fetch system admin status:', error)
			setIsSystemAdmin(false)
		}
	}, [currentMode])

	const updateContextState = useCallback((context: ContextMode, user: AppUser | null, isAuth: boolean, tenantId?: string | null) => {
		const tokens = tokenManager.getTokens(context)
		const contextState = {
			user,
			permissions: [],
			roles: user?.roles || [],
			tokens,
			isAuthenticated: isAuth,
			tenantId: tenantId || user?.tenant_id || null,
			lastUpdated: Date.now()
		}
		
		contextManager.setContextState(context, contextState)
		
		if (context === 'global') {
			setGlobalContext({ user, isAuthenticated: isAuth, tenantId: tenantId || user?.tenant_id || null })
		} else if (context === 'tenant') {
			setTenantContext({ user, isAuthenticated: isAuth, tenantId: tenantId || user?.tenant_id || null })
		}
	}, [])

	const handleAuthSuccessInternal = useCallback(
		async (authResult: AuthResult, preserveContext = false) => {
			const targetContext = preserveContext ? currentMode : (authResult.access_token && decodeToken(authResult.access_token)?.tenant_id ? 'tenant' : 'global')
			
			// Store tokens in appropriate context
			tokenManager.setTokens(targetContext, authResult.access_token, authResult.refresh_token || null)
			
			// Set cookies for middleware
			document.cookie = `accessToken=${authResult.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
			if (authResult.refresh_token) {
				document.cookie = `refreshToken=${authResult.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
			}
			
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

			console.log('Authentication successful, state updated (including admin and tenant status).')

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

			if (appUser && scheduleTokenRefreshRef.current) {
				scheduleTokenRefreshRef.current(authResult.refresh_token || authResult.access_token)
			}
		},
		[currentMode, checkSystemAdminStatus, updateContextState, router],
	)

	// Context switching methods
	const switchToTenant = useCallback(async (tenantId: string, options: ContextSwitchOptions = {}): Promise<ContextSwitchResult> => {
		setIsTransitioning(true)
		try {
			const result = await contextManager.switchContext('tenant', tenantId, options)
			if (result.success) {
				setCurrentMode('tenant')
				
				// Load tenant context state
				const tenantState = contextManager.getContextState('tenant')
				if (tenantState) {
					setUser(tenantState.user)
					setIsAuthenticated(tenantState.isAuthenticated)
					setCurrentTenantId(tenantState.tenantId)
					
					// Update API client with tenant tokens
					const tenantTokens = tokenManager.getTokens('tenant')
					if (tenantTokens.accessToken) {
						apiClient.defaults.headers.Authorization = `Bearer ${tenantTokens.accessToken}`
					}
				}
				
				toast.success(`Switched to tenant context: ${tenantId}`)
			} else {
				toast.error(result.error || 'Failed to switch to tenant context')
			}
			return result
		} finally {
			setIsTransitioning(false)
		}
	}, [currentMode])

	const switchToGlobal = useCallback(async (options: ContextSwitchOptions = {}): Promise<ContextSwitchResult> => {
		setIsTransitioning(true)
		try {
			const result = await contextManager.switchContext('global', undefined, options)
			if (result.success) {
				setCurrentMode('global')
				
				// Load global context state
				const globalState = contextManager.getContextState('global')
				if (globalState) {
					setUser(globalState.user)
					setIsAuthenticated(globalState.isAuthenticated)
					setCurrentTenantId(globalState.tenantId)
					
					// Update API client with global tokens
					const globalTokens = tokenManager.getTokens('global')
					if (globalTokens.accessToken) {
						apiClient.defaults.headers.Authorization = `Bearer ${globalTokens.accessToken}`
					}
				}
				
				toast.success('Switched to global context')
			} else {
				toast.error(result.error || 'Failed to switch to global context')
			}
			return result
		} finally {
			setIsTransitioning(false)
		}
	}, [])

	const switchContext = useCallback(async (mode: ContextMode, tenantId?: string, options: ContextSwitchOptions = {}): Promise<ContextSwitchResult> => {
		if (mode === 'tenant') {
			return switchToTenant(tenantId!, options)
		} else {
			return switchToGlobal(options)
		}
	}, [switchToTenant, switchToGlobal])

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

	const canSwitchToTenant = useCallback((tenantId: string): boolean => {
		return contextManager.canSwitchToTenant(tenantId, user || undefined)
	}, [user])

	// Token refresh logic
	const handleScheduledRefreshInternal = useCallback(async () => {
		console.log('Attempting scheduled token refresh (internal)...')
		const currentTokens = tokenManager.getTokens(currentMode)
		
		if (!currentTokens.refreshToken) {
			console.log('No refresh token available for scheduled refresh.')
			await clearAuthData()
			return
		}
		
		try {
			const refreshResponse = await serviceRefreshToken(currentTokens.refreshToken)
			await handleAuthSuccessInternal(refreshResponse.auth, true) // Preserve current context
			console.log('Scheduled token refresh successful.')
		} catch (error) {
			console.error('Scheduled token refresh failed:', error)
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
				const decoded = jwtDecode<{exp: number}>(currentToken)
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
		setLoading(true)
		try {
			const currentTokens = tokenManager.getTokens(currentMode)
			
			if (currentTokens.accessToken) {
				apiClient.defaults.headers.Authorization = `Bearer ${currentTokens.accessToken}`
				document.cookie = `accessToken=${currentTokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
				if (currentTokens.refreshToken) {
					document.cookie = `refreshToken=${currentTokens.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
				}
				
				const decodedUser = decodeToken(currentTokens.accessToken)
				if (decodedUser) {
					setUser(decodedUser)
					setIsAuthenticated(true)
					setCurrentTenantId(decodedUser.tenant_id || null)
					
					// Update context state
					updateContextState(currentMode, decodedUser, true)
					
					await checkSystemAdminStatus()
					console.log('User authenticated from stored access token.')
					
					if (scheduleTokenRefreshRef.current) {
						scheduleTokenRefreshRef.current(currentTokens.accessToken)
					}
				} else {
					console.log('Access token invalid/expired, attempting refresh...')
					if (currentTokens.refreshToken) {
						try {
							const refreshResponse = await serviceRefreshToken(currentTokens.refreshToken)
							await handleAuthSuccessInternal(refreshResponse.auth, true)
							console.log('User authenticated after initial token refresh.')
						} catch (refreshError) {
							console.error('Error during initial token refresh:', refreshError)
							await clearAuthData(true, false)
						}
					} else {
						console.log('No refresh token available.')
						await clearAuthData(true, false)
					}
				}
			} else {
				console.log('No stored access token.')
				setIsAuthenticated(false)
				setUser(null)
				setIsSystemAdmin(null)
				setCurrentTenantId(null)
			}
		} catch (error) {
			console.error('Error checking auth status:', error)
			setIsAuthenticated(false)
			setUser(null)
			setIsSystemAdmin(null)
			setCurrentTenantId(null)
		} finally {
			setLoading(false)
			setIsInitialLoad(false)
		}
	}, [currentMode, handleAuthSuccessInternal, clearAuthData, checkSystemAdminStatus, updateContextState])

	useEffect(() => {
		checkAuthStatus()
	}, [checkAuthStatus])

	// Social login methods (unchanged logic, but now context-aware)
	const signInWithGoogle = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new GoogleAuthProvider()
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = { provider: 'google', id_token: idToken }
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccessInternal(response.auth)
			toast.success('Successfully signed in with Google!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Google sign-in failed.'
			toast.error(`Google sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccessInternal])

	const signInWithFacebook = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new FacebookAuthProvider()
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = { provider: 'facebook', id_token: idToken }
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccessInternal(response.auth)
			toast.success('Successfully signed in with Facebook!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Facebook sign-in failed.'
			toast.error(`Facebook sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccessInternal])

	const signInWithApple = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new OAuthProvider('apple.com')
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = { provider: 'apple', id_token: idToken }
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccessInternal(response.auth)
			toast.success('Successfully signed in with Apple!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Apple sign-in failed.'
			toast.error(`Apple sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccessInternal])

	const signInWithTwitter = useCallback(async () => {
		setLoading(true)
		try {
			const provider = new OAuthProvider('twitter.com')
			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const exchangeData: SocialTokenExchangeInput = { provider: 'twitter', id_token: idToken }
			const response = await exchangeFirebaseToken(exchangeData)
			await handleAuthSuccessInternal(response.auth)
			toast.success('Successfully signed in with Twitter!')
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Twitter sign-in failed.'
			toast.error(`Twitter sign-in failed: ${msg}`)
			throw error
		} finally {
			setLoading(false)
		}
	}, [handleAuthSuccessInternal])

	const signInWithEmail = useCallback(async (data: LoginInput) => {
		setLoading(true)
		try {
			const response = await serviceSignInWithEmail(data)
			if (response.two_factor_required) {
				setIsTwoFactorPending(true)
				setTwoFactorSessionToken(response.two_factor_session_token || null)
				setLoading(false)
				return { success: true, twoFactorRequired: true, sessionToken: response.two_factor_session_token }
			} else if (response.auth) {
				await handleAuthSuccessInternal(response.auth)
				toast.success('Successfully signed in!')
				return { success: true, twoFactorRequired: false }
			} else {
				throw new Error('Invalid response from server')
			}
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Email sign-in failed.'
			toast.error(`Sign-in failed: ${msg}`)
			setLoading(false)
			return { success: false, twoFactorRequired: false, error }
		}
	}, [handleAuthSuccessInternal])

	const verifyTwoFactorCode = useCallback(
		async (data: Verify2FARequest) => {
			setLoading(true)
			try {
				if (!twoFactorSessionToken) {
					throw new Error('No 2FA session token available')
				}
				const response = await verifyTwoFactorLogin({ ...data, two_factor_session_token: twoFactorSessionToken })
				if (response.auth) {
					await handleAuthSuccessInternal(response.auth)
					setIsTwoFactorPending(false)
					setTwoFactorSessionToken(null)
					toast.success('Successfully verified 2FA!')
					return { success: true }
				} else {
					throw new Error('Invalid 2FA response')
				}
			} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : 'Invalid 2FA code or session expired.'
				toast.error(`2FA verification failed: ${msg}`)
				setIsTwoFactorPending(false)
				setTwoFactorSessionToken(null)
				return { success: false, error }
			} finally {
				setLoading(false)
			}
		},
		[twoFactorSessionToken, handleAuthSuccessInternal],
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
		await clearAuthData()
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
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

				await handleAuthSuccessInternal({ access_token, refresh_token })
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
		[handleAuthSuccessInternal],
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
		verifyTwoFactorCode,
		register,
		logout,
		
		// Context switching
		switchToTenant,
		switchToGlobal,
		switchContext,
		
		// Two-factor
		isTwoFactorPending,
		twoFactorSessionToken,
		
		// Enhanced methods
		handleAuthSuccess: handleAuthSuccessInternal,
		signInWithOAuth2Code,
		
		// Utilities
		getActiveContext,
		canSwitchToTenant,
		rollbackContext,
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
