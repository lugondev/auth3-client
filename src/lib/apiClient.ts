import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import { getTokens, refreshToken, logoutUser } from '@/services/authService'; // Import JWT handling functions

// --- Start: Backend Type Definitions ---

// Based on internal/modules/account/domain/models.go
export type UserStatus = "active" | "pending" | "blocked" | "inactive";

// Based on internal/modules/account/domain/role.go
// Assuming Permission is a string for simplicity, adjust if it's more complex
export type Permission = string;

// Based on internal/modules/account/domain/role_dto.go
export interface RoleOutput {
	id: string; // uuid.UUID maps to string
	name: string;
	description: string;
	permissions: Permission[];
	created_at: string; // time.Time maps to string (ISO 8601)
	updated_at: string; // time.Time maps to string
}

// Based on internal/modules/account/domain/user_dto.go and models.go
export interface UserOutput {
	id: string; // uuid.UUID
	email: string;
	first_name: string;
	last_name: string;
	phone?: string;
	avatar?: string;
	role?: RoleOutput | null; // Role can be null if not loaded or doesn't exist
	status: UserStatus;
	created_at: string; // time.Time
	updated_at: string; // time.Time
}

export interface UserPreferences {
	email_notifications: boolean;
	push_notifications: boolean;
	language: string;
	theme: string;
}

export interface UserProfile {
	id: string; // uuid.UUID
	user_id: string; // uuid.UUID
	bio?: string;
	date_of_birth?: string | null; // time.Time can be null/zero
	address?: string;
	interests?: string[];
	preferences?: UserPreferences; // Can be optional or have defaults
	created_at: string; // time.Time
	updated_at: string; // time.Time
}

// Based on internal/modules/account/domain/auth_dto.go
export interface RegisterInput {
	email: string;
	password: string;
	first_name?: string; // Optional based on typical registration
	last_name?: string;  // Optional
}

export interface LoginInput {
	email: string;
	password: string;
}

export interface SocialTokenExchangeInput {
	token: string; // The ID token from the social provider (e.g., Firebase)
	provider: string; // Added provider field, e.g., "firebase", "google"
}

export interface ForgotPasswordInput {
	email: string;
}

export interface ResetPasswordInput {
	token: string;
	new_password: string;
}

export interface EmailVerificationOutput {
	message: string; // Example: "Email verified successfully"
}

// Based on internal/modules/account/domain/social_dto.go
// Assuming SocialLoginInput might be needed if using direct social routes
export interface SocialLoginInput {
	provider: string; // e.g., "google", "facebook"
	code?: string;     // Authorization code from provider redirect
	id_token?: string; // ID token (if applicable, e.g., Google Sign-In)
	// Add other fields as needed based on the specific social provider flow
}


// Input DTOs for User operations (Keep existing)
export interface UpdateUserInput {
	first_name?: string;
	last_name?: string;
	phone?: string;
	status?: UserStatus; // Make optional for partial updates
}

export interface UpdateProfileInput {
	bio?: string;
	date_of_birth?: string | null; // Use string for date input, backend parses
	address?: string;
	interests?: string[];
	preferences?: Partial<UserPreferences>; // Allow partial updates for preferences
}

export interface UpdatePasswordInput {
	current_password: string;
	new_password: string;
}

// Based on internal/modules/account/domain/auth_dto.go
export interface AuthResult {
	access_token: string;
	refresh_token?: string;
	expires_in?: number; // Optional: Expiry time if provided
}

// Combined Login/Register/Refresh/Exchange Output
// Combining AuthResult and potential user/profile data returned on login/exchange
export interface AuthResponse {
	auth: AuthResult;
	user?: UserOutput; // User might be returned on login/register/refresh
	profile?: UserProfile; // Profile might be returned on login/register/refresh
}

// Paginated results for users and roles
export interface PaginatedUsers {
	users: UserOutput[];
	total: number; // Assuming int64 maps to number
	page: number;
	page_size: number;
	total_pages: number;
}

export interface PaginatedRoles {
	roles: RoleOutput[];
	total: number; // Assuming int64 maps to number
	page: number;
	page_size: number;
	total_pages: number;
}

// Search query parameters
export interface UserSearchQuery {
	query?: string;
	status?: UserStatus;
	role_id?: string; // uuid.UUID
	page?: number;
	page_size?: number;
}

// Type for UpdatePasswordResponse in user_handler.go
export interface UpdatePasswordResponse {
	message: string;
}

// --- End: Backend Type Definitions ---


const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
});

let isRefreshing = false;
type FailedQueueItem = {
	resolve: (value: unknown) => void;
	reject: (reason?: AxiosError | null) => void;
};
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
	failedQueue.forEach(prom => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

// Request Interceptor: Add JWT to headers
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
		const { accessToken } = getTokens();

		const skipAuth = config.headers?.['__skipAuthRefresh'] === 'true';
		if (accessToken && !skipAuth) {
			if (!config.headers) {
				config.headers = new AxiosHeaders();
			}
			config.headers.set('Authorization', `Bearer ${accessToken}`);
		}

		if (skipAuth) {
			delete config.headers['__skipAuthRefresh'];
		}

		return config;
	},
	(error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle 401 errors and token refresh
apiClient.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

		// Use status code from response if available, otherwise check error message potentially
		const statusCode = error.response?.status;

		// Check if it's a 401 error, not a refresh token failure itself, and not already retried
		// Backend refresh endpoint is /auth/refresh
		if (statusCode === 401 && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) {

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(token => {
					if (originalRequest.headers) {
						originalRequest.headers['Authorization'] = `Bearer ${token}`;
					}
					// Ensure the retry uses the original method, data, etc.
					return apiClient(originalRequest);
				}).catch(err => {
					return Promise.reject(err); // Propagate refresh error
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Use the updated AuthResponse type here
				const refreshResponse = await refreshToken();
				// Check access_token within the nested 'auth' object
				if (refreshResponse?.auth.access_token) {
					const newAccessToken = refreshResponse.auth.access_token;
					console.log('Token refreshed successfully. Retrying original request.');
					if (originalRequest.headers) {
						originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
					}
					processQueue(null, newAccessToken);
					return apiClient(originalRequest);
				} else {
					console.error('Refresh endpoint did not return a new access token.');
					processQueue(error, null);
					await logoutUser(); // Logout if refresh fails definitively
					return Promise.reject(error);
				}
			} catch (refreshError) {
				console.error('Failed to refresh token:', refreshError);
				processQueue(refreshError as AxiosError, null);
				// logoutUser is likely called within refreshToken on failure
				// await logoutUser(); // Consider if double logout is needed
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// Log details for non-401 or already retried errors
		console.error('API call error:', error.response?.data || error.message);
		// Optionally handle specific error types (e.g., 403 Forbidden, 404 Not Found)
		// if (statusCode === 403) { ... }

		return Promise.reject(error);
	}
);

export default apiClient;


// NOTE: Removed redundant interface definitions at the end as they are now defined at the top.
// Interfaces like Venue, CreateVenueInput, etc., should be moved to a separate file
// (e.g., src/services/venueService.ts or src/types/venue.ts) if they grow complex.
