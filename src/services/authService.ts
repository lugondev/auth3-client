import apiClient, {
	AuthResponse, // Use the new combined response type
	// Types specific to auth operations:
	LoginInput,
	RegisterInput,
	ForgotPasswordInput,
	ResetPasswordInput,
	SocialTokenExchangeInput,
	EmailVerificationOutput,
	AuthResult, // Used by storeTokens
} from '@/lib/apiClient';
import { auth } from '@/lib/firebase'; // Import Firebase auth if needed
import { signOut } from 'firebase/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Removed old TokenResponse interface

/**
 * Exchanges a social provider's token (e.g., Firebase ID token) for a custom JWT from the backend.
 * @param data The social token exchange data (SocialTokenExchangeInput).
 * @returns An AuthResponse containing tokens and potentially user/profile data.
 */
export const exchangeFirebaseToken = async (data: SocialTokenExchangeInput): Promise<AuthResponse> => {
	try {
		// Expect AuthResponse from the backend endpoint
		const response = await apiClient.post<AuthResponse>('/auth/social-token-exchange', data);
		return response.data;
	} catch (error) {
		console.error('Error exchanging Firebase token:', error);
		throw error; // Re-throw the error to be handled by the caller
	}
};

/**
 * Signs in a user using email and password.
 * @param data Login credentials (LoginInput).
 * @returns An AuthResponse containing tokens and user data.
 */
export const signInWithEmail = async (data: LoginInput): Promise<AuthResponse> => {
	try {
		// Expect AuthResponse from the backend /auth/login endpoint
		const response = await apiClient.post<AuthResponse>('/auth/login', data);
		// No need to store tokens here, AuthContext will handle it
		return response.data;
	} catch (error) {
		console.error('Error signing in with email:', error);
		throw error; // Re-throw to be handled by the caller (AuthContext/LoginForm)
	}
};

/**
 * Logs the user out by clearing tokens and signing out from Firebase.
 * Optionally calls the backend logout endpoint.
 */

/**
 * Registers a new user.
 * @param data The registration data (RegisterInput).
 * @returns An AuthResponse containing tokens and user data.
 */
export const register = async (data: RegisterInput): Promise<AuthResponse> => {
	try {
		const response = await apiClient.post<AuthResponse>('/auth/register', data);
		// AuthContext will handle storing tokens and user state
		return response.data;
	} catch (error) {
		console.error('Error registering user:', error);
		throw error;
	}
};


/**
 * Sends a password reset email.
 * @param data The email address (ForgotPasswordInput).
 */
export const forgotPassword = async (data: ForgotPasswordInput): Promise<void> => {
	try {
		await apiClient.post('/auth/password/forgot', data);
		console.log('Forgot password request sent.');
	} catch (error) {
		console.error('Error sending forgot password request:', error);
		throw error;
	}
};

/**
 * Resets the user's password using a token.
 * @param data The reset token and new password (ResetPasswordInput).
 */
export const resetPassword = async (data: ResetPasswordInput): Promise<void> => {
	try {
		await apiClient.post('/auth/password/reset', data);
		console.log('Password reset successful.');
	} catch (error) {
		console.error('Error resetting password:', error);
		throw error;
	}
};

/**
 * Verifies the user's email using a token.
 * @param token The verification token from the URL/email link.
 * @returns EmailVerificationOutput (adjust based on backend response).
 */
export const verifyEmail = async (token: string): Promise<EmailVerificationOutput> => {
	try {
		// Backend expects GET request for email verification
		const response = await apiClient.get<EmailVerificationOutput>(`/auth/email/verify/${token}`);
		console.log('Email verification successful.');
		return response.data;
	} catch (error) {
		console.error('Error verifying email:', error);
		throw error;
	}
};


// --- Token Management ---

/**
 * Stores the access and refresh tokens from AuthResult.
 * Note: This function now expects AuthResult directly, not AuthResponse['auth']
 * as refreshToken returns AuthResponse which contains AuthResult.
 * @param authResult The AuthResult object containing the tokens.
 */
export const storeTokens = (authResult: AuthResult): void => {
	localStorage.setItem(ACCESS_TOKEN_KEY, authResult.access_token);
	if (authResult.refresh_token) {
		localStorage.setItem(REFRESH_TOKEN_KEY, authResult.refresh_token);
	} else {
		// Ensure old refresh token is removed if not provided in the new set
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	}
};

/**
 * Retrieves the stored access and refresh tokens.
 * @returns An object containing the access and refresh tokens, or null if not found.
 */
export const getTokens = (): { accessToken: string | null; refreshToken: string | null } => {
	const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
	const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
	return { accessToken, refreshToken };
};

/**
 * Clears the stored access and refresh tokens.
 */
export const clearTokens = (): void => {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Refreshes the access token using the refresh token.
 * Uses the `/auth/refresh` endpoint.
 * @returns An AuthResponse containing the new tokens.
 */
export const refreshToken = async (): Promise<AuthResponse | null> => {
	const { refreshToken: currentRefreshToken } = getTokens();
	if (!currentRefreshToken) {
		console.log('No refresh token available.');
		return null;
	}

	try {
		// Expect AuthResponse from the backend refresh endpoint
		const response = await apiClient.post<AuthResponse>('/auth/refresh', {
			refresh_token: currentRefreshToken, // Backend expects this field
		}, {
			headers: { '__skipAuthRefresh': 'true' } // Signal to skip auth interceptor logic
		});

		// Store the new tokens from the nested 'auth' object
		storeTokens(response.data.auth);
		console.log('Token refreshed successfully.');
		return response.data; // Return the full AuthResponse
	} catch (error) {
		console.error('Error refreshing token:', error);
		// If refresh fails (e.g., refresh token expired/invalid), clear tokens and log out
		await logoutUser(); // Use the comprehensive logout function
		return null;
	}
};


/**
 * Logs the user out by clearing tokens and signing out from Firebase.
 * Calls the backend logout endpoint.
 */
export const logoutUser = async (): Promise<void> => {
	try {
		// Notify backend about logout
		await apiClient.post('/auth/logout', null, { // Send null body if backend expects it
			headers: { '__skipAuthRefresh': 'true' } // Don't try to refresh if logout fails with 401
		});
		console.log('Backend logout notification sent.');
	} catch (error) {
		// Log error but proceed with local logout anyway
		console.error('Error during backend logout notification:', error);
	} finally {
		clearTokens();
		// Sign out from Firebase as well
		try {
			await signOut(auth);
			console.log('Firebase sign-out successful.');
		} catch (firebaseError) {
			console.error('Error signing out from Firebase:', firebaseError);
		}
		// Redirect to home/login page
		// Use router push for client-side navigation without full page reload
		// Ensure this code runs client-side where window is available
		if (typeof window !== 'undefined') {
			window.location.href = '/'; // Or use Next.js router if available
		}
	}
};

// User profile management functions have been moved to userService.ts
