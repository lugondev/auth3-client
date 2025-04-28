'use client'

import {createContext, useContext, useEffect, useState, useCallback} from 'react'
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
import {RoleOutput, SocialTokenExchangeInput, LoginInput, RegisterInput, AuthResult} from '@/lib/apiClient' // Added AuthResult
// Import react-hot-toast
import toast from 'react-hot-toast'

// Define the shape of the user object derived from the JWT payload and UserOutput
// Aligning more closely with UserOutput for consistency
interface AppUser {
	id: string
	email: string
	first_name?: string // Use snake_case from backend DTO
	last_name?: string // Use snake_case from backend DTO
	avatar?: string
	role?: RoleOutput | null // Use RoleOutput type
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
			role?: RoleOutput // Expect the role object directly if included in JWT
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
			role: decoded.role || null, // Handle case where role might not be in JWT
		}
	} catch (error) {
		console.error('Failed to decode token:', error)
		return null
	}
}

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export function AuthProvider({children}: {children: React.ReactNode}) {
	const [user, setUser] = useState<AppUser | null>(null)
	const [loading, setLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)

	// Use useLocalStorage for tokens
	const [accessToken, setAccessToken] = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null)
	const [refreshToken, setRefreshToken] = useLocalStorage<string | null>(REFRESH_TOKEN_KEY, null)

	// Function to clear tokens and user state
	const clearAuthData = useCallback(async () => {
		setAccessToken(null)
		setRefreshToken(null)
		setUser(null)
		setIsAuthenticated(false)
		// Call serviceLogout for backend notification and Firebase signout (best effort)
		await serviceLogout()
	}, [setAccessToken, setRefreshToken])

	// Helper to update state after successful authentication
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
		},
		[setAccessToken, setRefreshToken],
	)

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
				} else {
					// Access token exists but is invalid/expired, try refreshing
					console.log('Access token invalid/expired, attempting refresh...')
					if (refreshToken) {
						try {
							// Pass the current refresh token to the service function
							const refreshResponse = await serviceRefreshToken(refreshToken)
							// Update tokens and user state using the helper
							handleAuthenticationSuccess(refreshResponse.auth)
							console.log('User authenticated after token refresh.')
							// Optionally update user profile details if included in refreshResponse.user
						} catch (refreshError) {
							console.error('Error during token refresh:', refreshError)
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
				const authResponse = await serviceRegister(data)
				handleAuthenticationSuccess(authResponse.auth)
				console.log('Registration successful.')
				toast.success('Successfully registered and signed in!')
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
