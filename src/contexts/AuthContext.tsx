'use client'

import {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react' // Added useRef
import {
	GoogleAuthProvider,
	FacebookAuthProvider,
	OAuthProvider,
	signInWithPopup,
	signOut as firebaseSignOut,
	User as FirebaseUser, // Keep type for initial login step
} from 'firebase/auth'
import {auth} from '@/lib/firebase'
// Import useLocalStorage
import {useLocalStorage} from 'usehooks-ts'
import {
	exchangeFirebaseToken,
	// storeTokens, // Removed
	// getTokens, // Removed
	logoutUser as serviceLogout, // Service function now handles backend notification + firebase signout
	refreshToken as serviceRefreshToken, // Now requires refreshToken argument
	signInWithEmail as serviceSignInWithEmail,
	register as serviceRegister,
	verifyTwoFactorLogin, // <-- Import the missing service function
	// switchTenantContext, // Placeholder, will be added to authService later
} from '@/services/authService'
// Assuming getUserTenants will be in tenantService or a new userService
// import {getUserTenants} from '@/services/tenantService' // Placeholder, will be added later
import apiClient from '@/lib/apiClient' // Import apiClient
import {jwtDecode} from 'jwt-decode'
// Import types needed for service calls and user object
// Changed RoleOutput to string[] based on apiClient.ts UserOutput
// Added LoginOutput and Verify2FARequest for the new flow
import {
	SocialTokenExchangeInput,
	LoginInput,
	RegisterInput,
	AuthResult,
	LoginOutput, // <-- Add LoginOutput type
	Verify2FARequest, // <-- Add Verify2FARequest type
	UserTenantMembershipInfo, // Import for user's tenants list
} from '@/lib/apiClient'
// Import sonner
import {toast} from 'sonner'

// Define the shape of the user object derived from the JWT payload and UserOutput
// Aligning more closely with UserOutput for consistency
interface AppUser {
	id: string
	email: string
	first_name?: string // Use snake_case from backend DTO
	last_name?: string // Use snake_case from backend DTO
	avatar?: string
	roles?: string[] // Changed from role: RoleOutput | null to roles: string[]
	tenant_id?: string // Add tenant_id from JWT
	// Add 'exp' and 'iat' if needed for client-side expiry checks (though decodeToken handles exp)
	// exp?: number;
	// iat?: number;
}

interface AuthContextType {
	user: AppUser | null
	isAuthenticated: boolean
	loading: boolean
	currentTenantId: string | null // Currently active tenant ID
	userTenants: UserTenantMembershipInfo[] | null // List of tenants user belongs to
	signInWithGoogle: () => Promise<void>
	signInWithFacebook: () => Promise<void>
	signInWithApple: () => Promise<void>
	signInWithTwitter: () => Promise<void> // Added signInWithTwitter
	// Update signInWithEmail return type to indicate 2FA status
	signInWithEmail: (data: LoginInput) => Promise<{success: boolean; twoFactorRequired: boolean; sessionToken?: string; error?: unknown}>
	verifyTwoFactorCode: (data: Verify2FARequest) => Promise<{success: boolean; error?: unknown}> // <-- Add 2FA verification function
	register: (data: RegisterInput) => Promise<void>
	logout: () => Promise<void>
	fetchUserTenants: () => Promise<void>
	switchTenant: (tenantId: string) => Promise<boolean>
	isTwoFactorPending: boolean // <-- State to track if 2FA is pending
	twoFactorSessionToken: string | null // <-- Expose the session token
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

// Helper to decode JWT and get user data
const decodeToken = (token: string): AppUser | null => {
	try {
		// Adjust the expected payload structure based on your backend's JWT
		const decoded = jwtDecode<{
			sub: string // Standard JWT claim for user ID ('id' in AppUser)
			email: string
			first_name?: string // Corresponds to 'first_name' in AppUser
			last_name?: string // Corresponds to 'last_name' in AppUser
			avatar?: string // Corresponds to 'avatar' in AppUser
			roles?: string[] // Changed from role: RoleOutput to roles: string[]
			tenant_id?: string // Tenant ID from JWT
			exp: number // Standard expiry claim
			// Add other claims you expect, like 'iat' (issued at)
		}>(token)

		// Check if token is expired (optional but recommended)
		if (decoded.exp * 1000 < Date.now()) {
			console.log('Token expired')
			return null
		}

		// Map decoded claims to AppUser structure
		return {
			id: decoded.sub,
			email: decoded.email,
			first_name: decoded.first_name,
			last_name: decoded.last_name,
			avatar: decoded.avatar,
			roles: decoded.roles || [], // Changed from role to roles, default to empty array
			tenant_id: decoded.tenant_id,
		}
	} catch (error) {
		console.error('Failed to decode token:', error)
		return null
	}
}

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const REFRESH_MARGIN_MS = 10 * 60 * 1000 // 10 minutes in milliseconds
const MIN_REFRESH_DELAY_MS = 5 * 1000 // Minimum delay of 5 seconds

export function AuthProvider({children}: {children: React.ReactNode}) {
	const [user, setUser] = useState<AppUser | null>(null)
	const [loading, setLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [currentTenantId, setCurrentTenantId] = useState<string | null>(null)
	const [userTenants, setUserTenants] = useState<UserTenantMembershipInfo[] | null>(null)
	const [isTwoFactorPending, setIsTwoFactorPending] = useState(false) // <-- State for 2FA pending status
	const [twoFactorSessionToken, setTwoFactorSessionToken] = useState<string | null>(null) // <-- State for 2FA token
	const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref for the timeout ID

	// Use useLocalStorage for tokens
	const [accessToken, setAccessToken] = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null)
	const [refreshToken, setRefreshToken] = useLocalStorage<string | null>(REFRESH_TOKEN_KEY, null)

	// Function to clear tokens and user state
	const clearAuthData = useCallback(async () => {
		// Clear any pending refresh timeout
		if (refreshTimeoutRef.current) {
			clearTimeout(refreshTimeoutRef.current)
			refreshTimeoutRef.current = null
			console.log('Cleared scheduled token refresh.')
		}
		// Clear any pending refresh timeout
		if (refreshTimeoutRef.current) {
			clearTimeout(refreshTimeoutRef.current)
			refreshTimeoutRef.current = null
			console.log('Cleared scheduled token refresh.')
		}
		setAccessToken(null)
		setRefreshToken(null)
		setUser(null)
		setIsAuthenticated(false)
		setCurrentTenantId(null)
		setUserTenants(null)
		setIsTwoFactorPending(false) // <-- Reset 2FA state
		setTwoFactorSessionToken(null) // <-- Reset 2FA token
		// Call serviceLogout for backend notification and Firebase signout (best effort)
		try {
			await serviceLogout()
		} catch (error) {
			console.warn('Error during service logout on clearAuthData:', error) // Log as warning, as main goal is clearing client state
		}
	}, [setAccessToken, setRefreshToken]) // refreshTimeoutRef doesn't need to be dependency

	// --- Reordered useCallback definitions ---

	// Function to schedule the next token refresh (defined before handleAuthenticationSuccess)
	const scheduleTokenRefresh = useCallback(
		(currentAccessToken: string) => {
			// Clear any existing timeout
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current)
			}

			try {
				const decoded = jwtDecode<{exp: number}>(currentAccessToken)
				const expiresInMs = decoded.exp * 1000 - Date.now()
				let refreshDelay = expiresInMs - REFRESH_MARGIN_MS

				// Ensure delay is not negative and meets minimum threshold
				if (refreshDelay < MIN_REFRESH_DELAY_MS) {
					refreshDelay = MIN_REFRESH_DELAY_MS
					console.warn(`Token expiry too soon, scheduling refresh in ${MIN_REFRESH_DELAY_MS / 1000}s.`)
				}

				console.log(`Scheduling token refresh in ${refreshDelay / 1000 / 60} minutes.`)
				// Assign the handler function directly
				refreshTimeoutRef.current = setTimeout(handleScheduledRefresh, refreshDelay)
			} catch (error) {
				console.error('Failed to decode token for scheduling refresh:', error)
				// Optionally logout if token is fundamentally broken
				// clearAuthData();
			}
		},
		// handleScheduledRefresh dependency will be correct due to ordering and useCallback
		[], // Keep empty initially, will update later if needed, but it references a stable callback now
	)

	// Helper to update state after successful authentication (defined before handleScheduledRefresh)
	const handleAuthenticationSuccess = useCallback(
		(authResult: AuthResult) => {
			setAccessToken(authResult.access_token)
			if (authResult.refresh_token) {
				setRefreshToken(authResult.refresh_token)
			} else {
				setRefreshToken(null) // Clear if not provided
			}
			const appUser = decodeToken(authResult.access_token)
			setUser(appUser)
			setIsAuthenticated(!!appUser)

			if (appUser?.tenant_id) {
				setCurrentTenantId(appUser.tenant_id)
				// If we have a tenant-specific token, we might not need to fetch all tenants immediately,
				// or we might want to ensure userTenants list is populated if it's empty.
				// For now, if tenant_id is present, we assume this context is primary.
				// If userTenants is null, it implies it hasn't been fetched yet.
				if (!userTenants || userTenants.length === 0) {
					// Wrapped in a self-invoking async function to avoid making handleAuthSuccess async
					;(async () => {
						await fetchUserTenants()
					})()
				}
			} else {
				setCurrentTenantId(null)
				// If it's a global token, fetch user's tenants to allow selection or auto-selection
				// Wrapped in a self-invoking async function
				;(async () => {
					await fetchUserTenants()
				})()
			}
			console.log('Authentication successful, state updated.')

			// Schedule the next refresh only if token is valid
			if (appUser) {
				scheduleTokenRefresh(authResult.access_token)
			}
		},
		[setAccessToken, setRefreshToken, scheduleTokenRefresh, userTenants], // Added userTenants
	)

	// Function to fetch user's tenants
	const fetchUserTenants = useCallback(async () => {
		if (!isAuthenticated || !accessToken) {
			// Ensure user is authenticated
			// console.log("fetchUserTenants: User not authenticated or no access token.");
			// setUserTenants(null); // Clear if not authenticated
			return
		}
		console.log('Fetching user tenants...')
		try {
			// const tenants = await getUserTenants(); // This service needs to be implemented
			// For now, using a placeholder. Replace with actual API call.
			const response = await apiClient.get<{data: UserTenantMembershipInfo[]}>('/api/v1/me/tenants')
			const tenants = response.data.data

			setUserTenants(tenants)
			console.log('User tenants fetched: ', tenants)

			if (tenants && tenants.length === 1 && !currentTenantId) {
				// If only one tenant and no current tenant context, automatically switch
				console.log('User has one tenant, attempting to auto-switch...')
				await switchTenant(tenants[0].tenant_id)
			} else if (tenants && tenants.length > 0 && !currentTenantId) {
				// Multiple tenants, no current context - UI should prompt for selection
				console.log('User has multiple tenants, UI should prompt for selection.')
			} else if (!tenants || (tenants.length === 0 && !currentTenantId)) {
				console.log('User has no tenants, operating in global context or needs to create/join.')
			}
		} catch (error) {
			console.error('Failed to fetch user tenants:', error)
			toast.error('Could not load your organizations.')
			setUserTenants(null) // Clear on error
		}
	}, [isAuthenticated, accessToken, currentTenantId]) // Added dependencies

	// Function to switch tenant context
	const switchTenant = useCallback(
		async (tenantId: string): Promise<boolean> => {
			console.log(`Attempting to switch to tenant: ${tenantId}`)
			setLoading(true)
			try {
				// const authResult = await switchTenantContext(tenantId); // This service needs to be implemented
				// For now, using a placeholder. Replace with actual API call.
				const response = await apiClient.post<AuthResult>('/auth/switch-tenant', {tenant_id: tenantId})
				const authResult = response.data

				handleAuthenticationSuccess(authResult)
				toast.success(`Switched to organization: ${userTenants?.find((t) => t.tenant_id === tenantId)?.tenant_name || tenantId}`)
				setLoading(false)
				return true
			} catch (error) {
				console.error('Failed to switch tenant:', error)
				toast.error('Failed to switch organization.')
				setLoading(false)
				return false
			}
		},
		[handleAuthenticationSuccess, userTenants],
	) // Added dependencies

	// Function to handle the actual refresh call scheduled by setTimeout (defined last among these three)
	const handleScheduledRefresh = useCallback(async () => {
		console.log('Attempting scheduled token refresh...')
		const currentRefreshToken = refreshToken // Capture token value at the time of callback creation
		if (!currentRefreshToken) {
			console.log('No refresh token available for scheduled refresh.')
			await clearAuthData() // Logout if refresh token is missing when handler runs
			return
		}

		try {
			// Use the captured refresh token
			const refreshResponse = await serviceRefreshToken(currentRefreshToken)
			// On success, handleAuthenticationSuccess updates the access token in local storage,
			// updates user state, and schedules the next refresh, keeping the session active.
			handleAuthenticationSuccess(refreshResponse.auth)
			console.log('Scheduled token refresh successful.')
		} catch (error) {
			console.error('Scheduled token refresh failed:', error)
			toast.error('Session expired. Please log in again.') // Inform user
			await clearAuthData() // Logout on refresh failure
		}
		// Correct dependencies - relies on stable callbacks and captured refreshToken
	}, [refreshToken, handleAuthenticationSuccess, clearAuthData, serviceRefreshToken])

	// Update scheduleTokenRefresh dependencies now that handleScheduledRefresh is stable
	// (This requires a second replace, but we'll try fixing ordering first)
	// scheduleTokenRefresh's dependency array needs handleScheduledRefresh if not empty
	// Let's re-declare scheduleTokenRefresh to update its dependency if needed by TS linting later.
	// For now, assume the reordering suffices.

	// Check for existing tokens on initial load
	const checkAuthStatus = useCallback(async () => {
		setLoading(true)
		try {
			if (accessToken) {
				const decodedUser = decodeToken(accessToken)
				if (decodedUser) {
					setUser(decodedUser)
					setIsAuthenticated(true)
					if (decodedUser.tenant_id) {
						setCurrentTenantId(decodedUser.tenant_id)
					} else {
						setCurrentTenantId(null)
						// If global token and tenants not fetched, fetch them
						if (!userTenants) {
							await fetchUserTenants()
						}
					}
					console.log('User authenticated from stored access token.')
					scheduleTokenRefresh(accessToken)
				} else {
					console.log('Access token invalid/expired, attempting refresh...')
					if (refreshToken) {
						try {
							const refreshResponse = await serviceRefreshToken(refreshToken)
							handleAuthenticationSuccess(refreshResponse.auth) // This will set user, tokens, tenantId, and fetch tenants if needed
							console.log('User authenticated after initial token refresh.')
						} catch (refreshError) {
							console.error('Error during initial token refresh:', refreshError)
							await clearAuthData()
						}
					} else {
						console.log('No refresh token available to attempt refresh.')
						await clearAuthData()
					}
				}
			} else {
				console.log('No stored access token found.')
				await clearAuthData()
			}
		} catch (error) {
			console.error('Error during initial auth status check:', error)
			await clearAuthData()
		} finally {
			setLoading(false)
		}
	}, [accessToken, refreshToken, clearAuthData, handleAuthenticationSuccess, setAccessToken, userTenants, fetchUserTenants])

	useEffect(() => {
		checkAuthStatus()
	}, [checkAuthStatus]) // checkAuthStatus dependencies include fetchUserTenants now

	// Generic Social Sign-In Handler
	const handleSocialSignIn = useCallback(
		async (provider: GoogleAuthProvider | FacebookAuthProvider | OAuthProvider) => {
			setLoading(true)
			try {
				const result = await signInWithPopup(auth, provider)
				const firebaseUser: FirebaseUser = result.user
				const firebaseToken = await firebaseUser.getIdToken()

				// Determine provider string
				let providerId = 'unknown'
				if (provider instanceof GoogleAuthProvider) providerId = 'google'
				else if (provider instanceof FacebookAuthProvider) providerId = 'facebook'
				else if (provider instanceof OAuthProvider && provider.providerId === 'apple.com') providerId = 'apple'
				else if (provider instanceof OAuthProvider && provider.providerId === 'twitter.com') providerId = 'twitter' // Added Twitter

				const exchangeInput: SocialTokenExchangeInput = {
					token: firebaseToken,
					provider: providerId,
				}

				const authResponse = await exchangeFirebaseToken(exchangeInput)
				handleAuthenticationSuccess(authResponse.auth)

				await firebaseSignOut(auth)
				console.log('Firebase sign-out successful after token exchange.')
			} catch (error: unknown) {
				console.error('Social sign-in error:', error)
				let errorMessage = 'Please try again.'
				if (error instanceof Error) {
					errorMessage = error.message
				} else if (typeof error === 'string') {
					errorMessage = error
				}
				toast.error(`Sign-in failed: ${errorMessage}`)
				await clearAuthData()
			} finally {
				setLoading(false)
			}
		},
		[handleAuthenticationSuccess, clearAuthData],
	) // Correct syntax for useCallback

	const signInWithGoogle = async () => {
		await handleSocialSignIn(new GoogleAuthProvider())
	}

	const signInWithFacebook = async () => {
		await handleSocialSignIn(new FacebookAuthProvider())
	}

	const signInWithApple = async () => {
		await handleSocialSignIn(new OAuthProvider('apple.com'))
	}

	const signInWithTwitter = async () => {
		// Added signInWithTwitter function
		await handleSocialSignIn(new OAuthProvider('twitter.com'))
	}

	// Email/Password Sign-In Handler - Updated for 2FA
	const signInWithEmail = useCallback(
		async (data: LoginInput): Promise<{success: boolean; twoFactorRequired: boolean; sessionToken?: string; error?: unknown}> => {
			setLoading(true)
			setIsTwoFactorPending(false) // Reset pending state
			setTwoFactorSessionToken(null) // Reset token
			try {
				// Assume serviceSignInWithEmail now returns LoginOutput
				const response: LoginOutput = await serviceSignInWithEmail(data)

				if (response.two_factor_required && response.two_factor_session_token) {
					// 2FA is required
					console.log('2FA required, storing session token.')
					setTwoFactorSessionToken(response.two_factor_session_token)
					setIsTwoFactorPending(true)
					// Don't call handleAuthenticationSuccess yet
					setLoading(false)
					return {success: true, twoFactorRequired: true, sessionToken: response.two_factor_session_token}
				} else if (response.auth) {
					// Login successful without 2FA
					handleAuthenticationSuccess(response.auth) // This will also trigger fetchUserTenants if token is global
					console.log('Email/Password sign-in successful (no 2FA).')
					toast.success('Successfully signed in!')
					setLoading(false)
					return {success: true, twoFactorRequired: false}
				} else {
					// Should not happen based on API spec, but handle defensively
					throw new Error('Invalid login response structure.')
				}
			} catch (error: unknown) {
				console.error('Email/Password sign-in error:', error)
				let errorMessage = 'Please check your credentials and try again.'
				// Basic error handling, can be improved
				if (error instanceof Error) {
					errorMessage = error.message
				} else if (typeof error === 'object' && error && 'message' in error) {
					errorMessage = String(error.message) // Handle potential API error objects
				} else if (typeof error === 'string') {
					errorMessage = error
				}
				toast.error(`Sign-in failed: ${errorMessage}`)
				await clearAuthData() // Clear auth data on failure
				setLoading(false)
				return {success: false, twoFactorRequired: false, error}
			}
			// No finally block needed here as setLoading(false) is handled in branches
		},
		[handleAuthenticationSuccess, clearAuthData], // Added clearAuthData dependency
	)

	// 2FA Verification Handler
	const verifyTwoFactorCode = useCallback(
		async (data: Verify2FARequest): Promise<{success: boolean; error?: unknown}> => {
			setLoading(true)
			// Ensure we have the session token from the previous step
			if (!twoFactorSessionToken || data.two_factor_session_token !== twoFactorSessionToken) {
				console.error('2FA session token mismatch or missing.')
				toast.error('Invalid 2FA session. Please try logging in again.')
				await clearAuthData() // Clear auth state if session is invalid
				setLoading(false)
				return {success: false, error: new Error('Invalid 2FA session')}
			}

			try {
				// Assume a new service function verifyTwoFactorLogin exists
				// It should take Verify2FARequest and return LoginOutput on success
				const response: LoginOutput = await verifyTwoFactorLogin(data) // Need to add verifyTwoFactorLogin to authService

				if (response.auth) {
					// 2FA verification successful, complete login
					handleAuthenticationSuccess(response.auth) // This will also trigger fetchUserTenants if token is global
					setIsTwoFactorPending(false) // Clear pending state
					setTwoFactorSessionToken(null) // Clear token
					console.log('2FA verification successful.')
					toast.success('Successfully signed in!')
					setLoading(false)
					return {success: true}
				} else {
					// Should not happen on successful verification
					throw new Error('Invalid 2FA verification response structure.')
				}
			} catch (error: unknown) {
				console.error('2FA verification error:', error)
				let errorMessage = 'Invalid 2FA code or session expired. Please try again.'
				// Basic error handling
				if (error instanceof Error) {
					errorMessage = error.message
				} else if (typeof error === 'object' && error && 'message' in error) {
					errorMessage = String(error.message)
				} else if (typeof error === 'string') {
					errorMessage = error
				}
				toast.error(`2FA verification failed: ${errorMessage}`)
				// Don't clear full auth data here, just the 2FA state,
				// allowing the user to potentially retry the code input or restart login.
				setIsTwoFactorPending(false) // Reset pending state on failure
				setTwoFactorSessionToken(null) // Reset token on failure
				setLoading(false)
				return {success: false, error}
			}
		},
		[twoFactorSessionToken, handleAuthenticationSuccess, clearAuthData], // Added dependencies
	)

	// Register Handler
	const register = useCallback(async (data: RegisterInput) => {
		setLoading(true)
		try {
			await serviceRegister(data)
			console.log('Registration successful.')
			toast.success('Successfully registered!')
		} catch (error: unknown) {
			console.error('Registration error:', error)
			let errorMessage = 'Registration failed. Please try again.'
			if (error instanceof Error) {
				errorMessage = error.message
			} else if (typeof error === 'string') {
				errorMessage = error
			}
			toast.error(`Registration failed: ${errorMessage}`)
			setIsAuthenticated(false)
			setUser(null)
			// Re-throw the error so the form can catch it
			throw error
		} finally {
			setLoading(false)
		}
	}, []) // Correct syntax for useCallback

	// Logout function
	const logout = useCallback(async () => {
		setLoading(true)
		await clearAuthData() // Calls serviceLogout internally
		setLoading(false)
		console.log('User logged out.')
		toast.success('Successfully signed out.')
	}, [clearAuthData]) // Added clearAuthData to dependencies

	const value = {
		user,
		isAuthenticated,
		loading,
		signInWithGoogle,
		signInWithFacebook,
		signInWithApple,
		signInWithTwitter, // Added signInWithTwitter
		signInWithEmail,
		verifyTwoFactorCode, // <-- Add verify function to context value
		register,
		logout,
		fetchUserTenants,
		switchTenant,
		currentTenantId,
		userTenants,
		isTwoFactorPending, // <-- Add pending state to context value
		twoFactorSessionToken, // <-- Add session token to context value
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
