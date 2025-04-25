import apiClient, {
	AuthResponse, // Use the new combined response type
	UserOutput,
	UserProfile,
	UpdateUserInput,
	UpdateProfileInput,
	UpdatePasswordInput, // Added import
} from '@/lib/apiClient';
import { auth } from '@/lib/firebase'; // Import Firebase auth if needed
import { signOut } from 'firebase/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Removed old TokenResponse interface

/**
 * Exchanges a Firebase ID token for a custom JWT from the backend.
 * @param firebaseToken The Firebase ID token.
 * @returns An AuthResponse containing tokens and potentially user/profile data.
 */
export const exchangeFirebaseToken = async (firebaseToken: string): Promise<AuthResponse> => {
	try {
		// Expect AuthResponse from the backend endpoint
		const response = await apiClient.post<AuthResponse>('/auth/social-token-exchange', {
			token: firebaseToken,
		});
		return response.data;
	} catch (error) {
		console.error('Error exchanging Firebase token:', error);
		throw error; // Re-throw the error to be handled by the caller
	}
};

/**
 * Signs in a user using email and password.
 * @param email The user's email.
 * @param password The user's password.
 * @returns An AuthResponse containing tokens and user data.
 */
export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
	try {
		// Expect AuthResponse from the backend /auth/login endpoint
		const response = await apiClient.post<AuthResponse>('/auth/login', {
			email,
			password,
		});
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
 * Stores the access and refresh tokens from AuthResult.
 * @param authResult The AuthResult object containing the tokens.
 */
export const storeTokens = (authResult: AuthResponse['auth']): void => {
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
 * Optionally calls the backend logout endpoint.
 */
export const logoutUser = async (): Promise<void> => {
	try {
		// Optional: Notify backend about logout
		// await apiClient.post('/auth/logout');
		console.log('Attempting backend logout notification (if uncommented)...');
	} catch (error) {
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

// --- User Profile Management ---

/**
 * Fetches the currently authenticated user's basic information.
 * @returns The UserOutput data.
 */
export const getCurrentUser = async (): Promise<UserOutput> => {
	try {
		const response = await apiClient.get<UserOutput>('/users/me');
		return response.data;
	} catch (error) {
		console.error('Error fetching current user:', error);
		throw error;
	}
};

/**
 * Updates the currently authenticated user's basic information.
 * @param data The data to update (UpdateUserInput).
 * @returns The updated UserOutput data.
 */
export const updateCurrentUser = async (data: UpdateUserInput): Promise<UserOutput> => {
	try {
		const response = await apiClient.patch<UserOutput>('/users/me', data);
		return response.data;
	} catch (error) {
		console.error('Error updating current user:', error);
		throw error;
	}
};

/**
 * Fetches the currently authenticated user's profile information.
 * NOTE: The backend route for this is currently `/users/profile/:id`, which seems wrong for fetching one's *own* profile.
 * Assuming a `/users/me/profile` endpoint should exist or `/users/profile` fetches the logged-in user's profile.
 * Using `/users/profile` for now, adjust if the backend route is different.
 * @returns The UserProfile data.
 */
export const getCurrentUserProfile = async (): Promise<UserProfile> => {
	try {
		// TODO: Verify the correct backend endpoint for fetching the current user's profile
		const response = await apiClient.get<UserProfile>('/users/profile'); // Adjust endpoint if needed
		return response.data;
	} catch (error) {
		console.error('Error fetching current user profile:', error);
		throw error;
	}
};

/**
 * Updates the currently authenticated user's profile information.
 * Uses the `/users/profile` endpoint based on the backend router.
 * @param data The data to update (UpdateProfileInput).
 * @returns The updated UserProfile data.
 */
export const updateCurrentUserProfile = async (data: UpdateProfileInput): Promise<UserProfile> => {
	try {
		const response = await apiClient.patch<UserProfile>('/users/profile', data);
		return response.data;
	} catch (error) {
		console.error('Error updating current user profile:', error);
		throw error;
	}
};

/**
 * Updates the currently authenticated user's password.
 * Uses the `/users/password` endpoint.
 * @param data The current and new password (UpdatePasswordInput).
 */
export const updateCurrentUserPassword = async (data: UpdatePasswordInput): Promise<void> => {
	try {
		await apiClient.patch('/users/password', data);
		console.log('Password updated successfully.');
		// No specific data usually returned on success, maybe just status 200/204
	} catch (error) {
		console.error('Error updating password:', error);
		throw error;
	}
};

/**
 * Uploads an avatar for the currently authenticated user.
 * Uses the `/users/avatar` endpoint.
 * @param file The avatar image file.
 * @returns The updated UserOutput with the new avatar URL.
 */
export const updateUserAvatar = async (file: File): Promise<UserOutput> => {
	const formData = new FormData();
	formData.append('avatar', file); // Ensure the backend expects the key 'avatar'

	try {
		const response = await apiClient.post<UserOutput>('/users/avatar', formData, {
			headers: {
				'Content-Type': 'multipart/form-data', // Important for file uploads
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error uploading avatar:', error);
		throw error;
	}
};
