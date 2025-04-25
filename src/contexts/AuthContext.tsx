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
import {
	exchangeFirebaseToken,
	storeTokens, // Accepts AuthResponse['auth'] now
	getTokens,
	logoutUser as serviceLogout,
	refreshToken as serviceRefreshToken, // Returns AuthResponse | null
	signInWithEmail as serviceSignInWithEmail,
	register as serviceRegister, // <-- Add register import
} from '@/services/authService'
import {jwtDecode} from 'jwt-decode'
// Import types needed for service calls and user object
import {RoleOutput, SocialTokenExchangeInput, LoginInput, RegisterInput} from '@/lib/apiClient' // <-- Add RegisterInput
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

export function AuthProvider({children}: {children: React.ReactNode}) {
	const [user, setUser] = useState<AppUser | null>(null)
	const [loading, setLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)

	// Check for existing tokens on initial load
	const checkAuthStatus = useCallback(async () => {
		// Ensure loading is set false even if errors occur during check
		try {
			setLoading(true)
			// Only accessToken is needed here for decoding, refreshToken is handled by the service
			const {accessToken} = getTokens()

			if (accessToken) {
				const decodedUser = decodeToken(accessToken)
				if (decodedUser) {
					// Token is valid and not expired
					setUser(decodedUser)
					setIsAuthenticated(true)
					console.log('User authenticated from stored token.')

					// Optional: Schedule refresh before expiry if needed
					// You could decode the token's expiry and use setTimeout
				} else {
					// Access token exists but is invalid/expired, try refreshing
					console.log('Access token invalid/expired, attempting refresh...')
					try {
						const refreshResponse = await serviceRefreshToken() // Returns AuthResponse | null
						// Access token is now nested: refreshResponse.auth.access_token
						if (refreshResponse?.auth.access_token) {
							// Decode the *new* access token
							const refreshedUser = decodeToken(refreshResponse.auth.access_token)
							if (refreshedUser) {
								setUser(refreshedUser)
								setIsAuthenticated(true)
								console.log('User authenticated after token refresh.')
								// Optionally update user state with potential user/profile data from refreshResponse
								// if (refreshResponse.user) { /* update user details */ }
							} else {
								console.error('Refreshed token is invalid.')
								await serviceLogout()
								setIsAuthenticated(false)
								setUser(null) // Ensure user state is cleared
							}
						} else {
							// Refresh failed or no refresh token
							console.log('Token refresh failed or no refresh token available.')
							await serviceLogout()
							setIsAuthenticated(false)
							setUser(null) // Ensure user state is cleared
						}
					} catch (error) {
						console.error('Error during initial token refresh:', error)
						await serviceLogout()
						setIsAuthenticated(false)
						setUser(null) // Ensure user state is cleared
					}
				}
			} else {
				// No access token found
				setIsAuthenticated(false)
				setUser(null)
				console.log('No stored token found.')
				setIsAuthenticated(false)
				setUser(null)
			}
		} catch (error) {
			console.error('Error during initial auth status check:', error)
			setIsAuthenticated(false)
			setUser(null)
			// await serviceLogout(); // Consider logout on critical check errors
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		checkAuthStatus()
	}, [checkAuthStatus])

	// Generic Social Sign-In Handler
	const handleSocialSignIn = async (provider: GoogleAuthProvider | FacebookAuthProvider | OAuthProvider) => {
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
			// Add other providers if needed

			// Prepare input for the updated service function
			const exchangeInput: SocialTokenExchangeInput = {
				token: firebaseToken,
				provider: providerId, // Pass the determined provider ID
			}

			// exchangeFirebaseToken now returns AuthResponse
			const authResponse = await exchangeFirebaseToken(exchangeInput)

			// Store tokens using the nested 'auth' object (AuthResult)
			storeTokens(authResponse.auth)

			// Decode the new access token from the response
			const appUser = decodeToken(authResponse.auth.access_token)
			setUser(appUser)
			setIsAuthenticated(!!appUser)

			// Optionally use user/profile data from authResponse if available and needed immediately
			// if (authResponse.user) { /* update state if necessary */ }

			await firebaseSignOut(auth)
			console.log('Firebase sign-out successful after token exchange.')
		} catch (error: unknown) {
			// Use 'unknown' for better type safety
			console.error('Social sign-in error:', error)
			// Check if error is an instance of Error to safely access message
			let errorMessage = 'Please try again.'
			if (error instanceof Error) {
				errorMessage = error.message
			} else if (typeof error === 'string') {
				errorMessage = error
			}
			// Show error toast
			toast.error(`Sign-in failed: ${errorMessage}`)
			// Ensure cleanup even on error
			await serviceLogout() // Use serviceLogout for full cleanup
			setIsAuthenticated(false)
			setUser(null)
		} finally {
			setLoading(false)
		}
	}

	const signInWithGoogle = async () => {
		await handleSocialSignIn(new GoogleAuthProvider())
	}

	const signInWithFacebook = async () => {
		await handleSocialSignIn(new FacebookAuthProvider())
	}

	const signInWithApple = async () => {
		// Ensure Apple provider is correctly configured in Firebase console
		await handleSocialSignIn(new OAuthProvider('apple.com'))
	}

	// Email/Password Sign-In Handler - Updated to accept LoginInput object
	const signInWithEmail = async (data: LoginInput) => {
		setLoading(true)
		try {
			// Call the service function for email/password login
			const authResponse = await serviceSignInWithEmail(data) // Pass the object directly

			// Store tokens using the nested 'auth' object (AuthResult)
			storeTokens(authResponse.auth)

			// Decode the new access token from the response
			const appUser = decodeToken(authResponse.auth.access_token)
			setUser(appUser)
			setIsAuthenticated(!!appUser)

			// Optionally use user/profile data from authResponse if available and needed immediately
			// if (authResponse.user) { /* update state if necessary */ }

			console.log('Email/Password sign-in successful.')
			toast.success('Successfully signed in!') // Success feedback
		} catch (error: unknown) {
			console.error('Email/Password sign-in error:', error)
			let errorMessage = 'Please check your credentials and try again.'
			if (error instanceof Error) {
				// Customize message based on potential API error responses if possible
				errorMessage = error.message // Or a more user-friendly version
			} else if (typeof error === 'string') {
				errorMessage = error
			}
			toast.error(`Sign-in failed: ${errorMessage}`)
			// Do NOT automatically logout here, let the user retry
			setIsAuthenticated(false)
			setUser(null)
			// Re-throw the error so the form can catch it for specific UI updates
			throw error
		} finally {
			setLoading(false)
		}
	}

	// Register Handler
	const register = async (data: RegisterInput) => {
		setLoading(true)
		try {
			const authResponse = await serviceRegister(data) // Call the service function

			// Store tokens and update user state, similar to login
			storeTokens(authResponse.auth)
			const appUser = decodeToken(authResponse.auth.access_token)
			setUser(appUser)
			setIsAuthenticated(!!appUser)

			console.log('Registration successful.')
			toast.success('Successfully registered and signed in!')
			// Redirect might happen automatically due to isAuthenticated changing,
			// or you might want an explicit redirect here.
		} catch (error: unknown) {
			console.error('Registration error:', error)
			let errorMessage = 'Registration failed. Please try again.'
			if (error instanceof Error) {
				errorMessage = error.message
			} else if (typeof error === 'string') {
				errorMessage = error
			}
			toast.error(`Registration failed: ${errorMessage}`)
			// Ensure user state is cleared on registration failure
			setIsAuthenticated(false)
			setUser(null)
			// Re-throw the error so the form can catch it
			throw error
		} finally {
			setLoading(false)
		}
	}

	// Logout function using the service
	const logout = async () => {
		setLoading(true)
		await serviceLogout()
		setUser(null)
		setIsAuthenticated(false)
		setLoading(false)
		// Redirect is handled within serviceLogout currently
	}

	const value = {
		user,
		isAuthenticated,
		loading,
		signInWithGoogle,
		signInWithFacebook,
		signInWithApple,
		signInWithEmail,
		register, // <-- Add register to context value
		logout,
	}

	// Render children only when loading is finished to prevent flicker
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
