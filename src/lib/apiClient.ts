import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
// Import only refreshToken
// getTokens is removed, tokens read directly from localStorage here.
// serviceLogout is no longer called directly from here.
import { refreshToken as serviceRefreshToken } from '@/services/authService';

// Define localStorage keys here as they are no longer in authService
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
	headers: {
		'Content-Type': 'application/json',
		'X-Request-ID': generateUUID(),
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
		// Only access localStorage on client side
		const accessToken = typeof window !== 'undefined'
			? localStorage.getItem(ACCESS_TOKEN_KEY)?.replaceAll('"', "")
			: null;

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

			// Read refresh token directly from localStorage (only on client side)
			const currentRefreshToken = typeof window !== 'undefined'
				? localStorage.getItem(REFRESH_TOKEN_KEY)?.replaceAll('"', "")
				: null;

			if (!currentRefreshToken) {
				console.log('Interceptor: No refresh token found, redirecting to login.');
				processQueue(error, null); // Reject pending requests
				// Redirect to login page
				if (typeof window !== 'undefined') {
					window.location.href = '/login';
				}
				return Promise.reject(error); // Reject the original request after triggering redirect
			}

			try {
				// Call the service function, passing the refresh token
				const refreshResponse = await serviceRefreshToken(currentRefreshToken);

				// Check access_token within the nested 'auth' object
				const newAccessToken = refreshResponse?.auth.access_token;
				if (newAccessToken) {
					// Note: The hook useLocalStorage will automatically update localStorage
					// via the handleAuthenticationSuccess callback in AuthContext upon success.
					// We just need the new token to retry the original request.
					console.log('Interceptor: Token refreshed successfully. Retrying original request.');
					if (originalRequest.headers) {
						originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
					}
					processQueue(null, newAccessToken); // Resolve pending requests with the new token
					return apiClient(originalRequest); // Retry the original request
				} else {
					// This case should ideally not happen if serviceRefreshToken works correctly
					console.error('Interceptor: Refresh endpoint returned response without a new access token.');
					processQueue(error, null); // Reject pending requests
					// No need to call logoutUser here
					return Promise.reject(error); // Reject the original request
				}
			} catch (refreshError) {
				console.error('Interceptor: Failed to refresh token via service:', refreshError);
				processQueue(refreshError as AxiosError, null); // Reject pending requests with the refresh error
				// Let AuthContext handle the logout state/UI changes upon catching this error.
				// Redirect to login page on refresh failure
				if (typeof window !== 'undefined') {
					// Avoid redirect loop if the refresh endpoint itself returns 401 repeatedly
					// Although the main check already prevents retrying /auth/refresh
					if ((refreshError as AxiosError).response?.status === 401) {
						console.warn("Refresh token endpoint returned 401, potential issue with refresh token itself.");
					}
					window.location.href = '/login';
				}
				return Promise.reject(refreshError); // Reject the original request with the refresh error
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

export { apiClient as default };

// Re-export types from @/types/user for convenience
export type {
	UserOutput,
	UserProfile,
	UpdateUserInput,
	UpdateProfileInput,
	UpdatePasswordInput,
	UpdatePasswordResponse,
	PaginatedUsers,
	UserSearchQuery,
	UpdateUserRequest,
	UserStatus,
	AuthResult,
	AuthResponse,
	LoginOutput,
	RegisterInput,
	LoginInput,
	SocialTokenExchangeInput,
	VerifyLoginLinkInput,
	RequestLoginLinkInput,
	ForgotPasswordInput,
	ResetPasswordInput,
	EmailVerificationOutput,
	VerifyPhoneInput,
	Generate2FAResponse,
	Verify2FARequest,
	TwoFactorRecoveryCodesResponse,
	Disable2FARequest,
	UserPreferences,
	RoleResponse,
	Permission
} from '@/types/user';
