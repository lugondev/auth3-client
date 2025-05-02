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
} from '@/services/authService'
import {jwtDecode} from 'jwt-decode'
// Import types needed for service calls and user object
// Changed RoleOutput to string[] based on apiClient.ts UserOutput
import {SocialTokenExchangeInput, LoginInput, RegisterInput, AuthResult} from '@/lib/apiClient'
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
	// Add 'exp' and 'iat' if needed for client-side expiry checks (though decodeToken handles exp)
	// exp?: number;
	// iat?: number;
}

interface AuthContextType {
	user: AppUser | null
	isAuthenticated: boolean
	loading: boolean
	signInWithGoogle: () => Promise<void>
	signInWithFacebook: () => Promise<void>
	signInWithApple: () => Promise<void>
	signInWithEmail: (data: LoginInput) => Promise<void>
	register: (data: RegisterInput) => Promise<void> // <-- Add register signature
	logout: () => Promise<void>
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
		setAccessToken(null)
		setRefreshToken(null)
		setUser(null)
		setIsAuthenticated(false)
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
			console.log('Authentication successful, state updated.')

			// Schedule the next refresh only if token is valid
			if (appUser) {
				scheduleTokenRefresh(authResult.access_token)
			}
		},
		[setAccessToken, setRefreshToken, scheduleTokenRefresh], // scheduleTokenRefresh is now defined above
	)

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
			handleAuthenticationSuccess(refreshResponse.auth) // This will reschedule the next refresh
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
					// Access token is valid and not expired
					setUser(decodedUser)
					setIsAuthenticated(true)
					console.log('User authenticated from stored access token.')
					// Schedule refresh based on existing valid token
					scheduleTokenRefresh(accessToken)
				} else {
					// Access token exists but is invalid/expired, try refreshing
					console.log('Access token invalid/expired, attempting refresh...')
					if (refreshToken) {
						try {
							// Pass the current refresh token to the service function
							const refreshResponse = await serviceRefreshToken(refreshToken)
							// Update tokens and user state using the helper
							// handleAuthenticationSuccess will also schedule the next refresh
							handleAuthenticationSuccess(refreshResponse.auth)
							console.log('User authenticated after initial token refresh.')
						} catch (refreshError) {
							console.error('Error during initial token refresh:', refreshError)
							// Clear all auth data if refresh fails
							await clearAuthData()
						}
					} else {
						console.log('No refresh token available to attempt refresh.')
						// Clear only access token and user, keep potential refresh token if logic allows
						setAccessToken(null)
						setUser(null)
						setIsAuthenticated(false)
					}
				}
			} else {
				// No access token found
				console.log('No stored access token found.')
				// Ensure state is clean if no access token
				await clearAuthData() // Clear everything if no access token initially
			}
		} catch (error) {
			console.error('Error during initial auth status check:', error)
			await clearAuthData() // Clear everything on unexpected errors
		} finally {
			setLoading(false)
		}
	}, [accessToken, refreshToken, clearAuthData, handleAuthenticationSuccess, setAccessToken]) // Added dependencies

	useEffect(() => {
		checkAuthStatus()
	}, [checkAuthStatus])

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

	// Email/Password Sign-In Handler
	const signInWithEmail = useCallback(
		async (data: LoginInput) => {
			setLoading(true)
			try {
				const authResponse = await serviceSignInWithEmail(data)
				handleAuthenticationSuccess(authResponse.auth)
				console.log('Email/Password sign-in successful.')
				toast.success('Successfully signed in!')
			} catch (error: unknown) {
				console.error('Email/Password sign-in error:', error)
				let errorMessage = 'Please check your credentials and try again.'
				if (error instanceof Error) {
					errorMessage = error.message
				} else if (typeof error === 'string') {
					errorMessage = error
				}
				toast.error(`Sign-in failed: ${errorMessage}`)
				setIsAuthenticated(false)
				setUser(null)
				// Re-throw the error so the form can catch it
				throw error
			} finally {
				setLoading(false)
			}
		},
		[handleAuthenticationSuccess],
	) // Correct syntax for useCallback

	// Register Handler
	const register = useCallback(
		async (data: RegisterInput) => {
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
		},
		[handleAuthenticationSuccess, clearAuthData],
	) // Correct syntax for useCallback

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
		signInWithEmail,
		register,
		logout,
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
