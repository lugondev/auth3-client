import apiClient from '@/lib/apiClient';
import axios from 'axios';
import { withErrorHandling } from './errorHandlingService';
import {
	AuthResponse,
	LoginOutput, // <-- Add LoginOutput
	// Types specific to auth operations:
	LoginInput,
	// Passwordless Login
	VerifyLoginLinkInput, // Added for passwordless
	RequestLoginLinkInput, // Added for passwordless
	RegisterInput,
	ForgotPasswordInput,
	ResetPasswordInput,
	SocialTokenExchangeInput,
	EmailVerificationOutput,
	// Phone Verification
	VerifyPhoneInput,
	// 2FA Types
	Generate2FAResponse,
	Verify2FARequest,
	TwoFactorRecoveryCodesResponse,
	Disable2FARequest,
} from '@/types/user';
import { ContextMode, ContextSwitchResult } from '@/types/dual-context';
import { tokenManager } from '@/lib/token-storage';
import { multiTenantTokenManager } from '@/lib/multi-tenant-token-manager';
import { contextManager } from '@/lib/context-manager';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

// Note: Token constants (ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY) and direct localStorage
// management functions (storeTokens, getTokens, clearTokens, dispatchStorageEvent)
// have been removed. Token storage and retrieval are now expected to be handled
// by a React hook using `useLocalStorage` (e.g., within AuthContext).
// This service now focuses solely on API interactions related to authentication.

/**
 * Exchanges a social provider's token (e.g., Firebase ID token) for a custom JWT from the backend.
 * @param data The social token exchange data (SocialTokenExchangeInput).
 * @param context The context mode for token exchange ('global' | 'tenant' | 'auto').
 * @returns An AuthResponse containing tokens and potentially user/profile data.
 */
export const exchangeFirebaseToken = async (data: SocialTokenExchangeInput, context: ContextMode = 'auto'): Promise<AuthResponse> => {
	try {
		// Add context information to the request
		const requestData = {
			...data,
			context_mode: context,
			preserve_global_context: context === 'tenant'
		};

		// Expect AuthResponse from the backend endpoint
		const response = await apiClient.post<AuthResponse>('/api/v1/auth/social-token-exchange', requestData);
		return response.data;
	} catch (error) {
		console.error('Error exchanging Firebase token:', error);
		throw error; // Re-throw the error to be handled by the caller
	}
};

/**
 * Signs in a user using email and password.
 * @param data Login credentials (LoginInput).
 * @param context The context mode for login ('global' | 'tenant' | 'auto').
 * @param preserveGlobalContext Whether to preserve global context when logging into tenant.
 * @returns A LoginOutput which might contain tokens or indicate 2FA is required.
 */
export const signInWithEmail = withErrorHandling(
	async (
		data: LoginInput,
		context: ContextMode = 'auto',
		preserveGlobalContext: boolean = true
	): Promise<LoginOutput> => {
		// Add context information to the request
		const requestData = {
			...data,
			context_mode: context,
			preserve_global_context: preserveGlobalContext
		};

		// Expect LoginOutput from the backend /auth/login endpoint
		const response = await apiClient.post<LoginOutput>('/api/v1/auth/login', requestData);
		// AuthContext will handle storing tokens or prompting for 2FA
		return response.data;
	}
);

/**
 * Verifies the 2FA code during login.
 * @param data The 2FA session token and code (Verify2FARequest).
 * @param context The context mode for 2FA verification ('global' | 'tenant' | 'auto').
 * @param preserveGlobalContext Whether to preserve global context.
 * @returns A LoginOutput containing the final tokens and user data upon success.
 */
export const verifyTwoFactorLogin = async (
	data: Verify2FARequest,
	context: ContextMode = 'auto',
	preserveGlobalContext: boolean = true
): Promise<LoginOutput> => {
	try {
		// Add context information to the request
		const requestData = {
			...data,
			context_mode: context,
			preserve_global_context: preserveGlobalContext
		};

		// Expect LoginOutput from the backend /auth/login/verify-2fa endpoint
		const response = await apiClient.post<LoginOutput>('/api/v1/auth/login/verify-2fa', requestData);
		// AuthContext will handle storing tokens on success
		return response.data;
	} catch (error) {
		console.error('Error verifying 2FA code during login:', error);
		throw error; // Re-throw to be handled by the caller (AuthContext)
	}
};

/**
 * Logs the user out by clearing tokens and signing out from Firebase.
 * Optionally calls the backend logout endpoint.
 */

/**
 * Registers a new user.
 * @param data The registration data (RegisterInput).
 * @param context The context mode for registration ('global' | 'tenant' | 'auto').
 * @returns An AuthResponse containing tokens and user data.
 */
export const register = withErrorHandling(
	async (data: RegisterInput, context: ContextMode = 'global'): Promise<AuthResponse> => {
		// Add context information to the request
		const requestData = {
			...data,
			context_mode: context
		};

		const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', requestData);
		// AuthContext will handle storing tokens and user state
		return response.data;
	}
);


/**
 * Sends a password reset email.
 * @param data The email address (ForgotPasswordInput).
 */
export const forgotPassword = async (data: ForgotPasswordInput): Promise<void> => {
	try {
		await apiClient.post('/api/v1/auth/forgot-password', data);
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
		await apiClient.post('/api/v1/auth/reset-password', data);
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
		const response = await apiClient.get<EmailVerificationOutput>(`/api/v1/auth/verify-email/${token}`);
		console.log('Email verification successful.');
		return response.data;
	} catch (error) {
		console.error('Error verifying email:', error);
		throw error;
	}
};


/**
 * Refreshes the access token using the provided refresh token.
 * Uses the `/auth/refresh` endpoint. The caller is responsible for storing
 * the new tokens and handling failures (e.g., logging out).
 * @param currentRefreshToken The current refresh token.
 * @param context The context mode for token refresh ('global' | 'tenant' | 'auto').
 * @returns An AuthResponse containing the new tokens, or throws an error on failure.
 */
export const refreshToken = async (currentRefreshToken: string, context: ContextMode = 'auto'): Promise<AuthResponse> => {
	if (!currentRefreshToken) {
		console.error('refreshToken service: No refresh token provided.');
		// Throw an error or handle appropriately, depending on desired contract
		throw new Error('Refresh token is required.');
	}

	try {
		// Add context information to the request
		const requestData = {
			refresh_token: currentRefreshToken,
			context_mode: context
		};

		const response = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', requestData, {
			headers: { '__skipAuthRefresh': 'true' } // Prevent interceptor loop
		});

		// Caller (e.g., AuthContext) is responsible for storing response.data.auth
		console.log('refreshToken service: Token refresh API call successful.');
		return response.data;
	} catch (error: Error | unknown) {
		console.error('refreshToken service: Error during token refresh API call:', error);

		// Handle 401 Unauthorized - use token manager to clear tokens
		if ((error as { response?: { status: number } })?.response?.status === 401) {
			console.log('refreshToken service: 401 error detected, clearing tokens and redirecting to login');

			// Clear tokens using token manager
			tokenManager.clearTokens(context);

			// Redirect to login page
			if (typeof window !== 'undefined') {
				window.location.href = '/login';
			}
		}

		// Re-throw the error so the caller (e.g., AuthContext) can handle it,
		// potentially by logging the user out.
		throw error;
	}
};

/**
 * Logs the user out by notifying the backend and signing out from Firebase.
 * The caller (e.g., AuthContext) is responsible for clearing local tokens/state.
 * @param context The context to logout from ('global' | 'tenant' | 'auto'). If 'auto', logs out from all contexts.
 * @param preserveGlobalContext Whether to preserve global context when logging out from tenant context.
 */
export const logoutUser = withErrorHandling(
	async (context: ContextMode = 'auto', preserveGlobalContext: boolean = false): Promise<void> => {
		// Caller is responsible for clearing tokens (e.g., via useLocalStorage setter)
		console.log('logoutUser service: Initiating logout process for context:', context);

		try {
			// Add context information to the logout request
			const requestData = {
				context_mode: context,
				preserve_global_context: preserveGlobalContext
			};

			// Notify backend about logout (best effort, don't block UI on failure)
			await apiClient.post('/api/v1/auth/logout', requestData, {
				headers: { '__skipAuthRefresh': 'true' } // Avoid potential issues if tokens were already cleared
			});
			console.log('logoutUser service: Backend logout notification sent.');
		} catch (error) {
			// Log non-critical error
			console.warn('logoutUser service: Error during backend logout notification:', error);
		}

		// Sign out from Firebase only if logging out from all contexts
		if (context === 'auto' || (context === 'global' && !preserveGlobalContext)) {
			try {
				await signOut(auth);
				console.log('logoutUser service: Firebase sign-out successful.');
			} catch (firebaseError) {
				console.error('logoutUser service: Error signing out from Firebase:', firebaseError);
				// Decide if this should be re-thrown or just logged
			}
		}
		// No redirect here, handled by UI/AuthContext based on auth state change
	}
);

// User profile management functions have been moved to userService.ts

// --- Phone Verification ---

/**
 * Requests a phone verification OTP to be sent to the authenticated user's phone.
 * @param phoneNumber - Optional phone number to verify (if not provided, uses user's current phone)
 * @returns Promise resolving when OTP is sent
 */
export const requestPhoneVerification = withErrorHandling(
	async (phoneNumber?: string): Promise<void> => {
		const payload = phoneNumber ? { phone_number: phoneNumber } : {};
		await apiClient.post('/api/v1/auth/verify-phone/request', payload);
		console.log('Phone verification OTP request sent.');
	}
);

/**
 * Verifies the phone number using the provided OTP.
 * @param otp - The OTP code received via SMS
 * @returns Promise resolving when phone is verified
 */
export const verifyPhone = withErrorHandling(
	async (otp: string): Promise<{ message: string; verified: boolean }> => {
		const response = await apiClient.post<{ message: string; verified: boolean }>(
			'/api/v1/auth/verify-phone/confirm',
			{ otp }
		);
		console.log('Phone verification successful.');
		return response.data;
	}
);

// --- Two-Factor Authentication (2FA) ---

/**
 * Generates a new 2FA secret and QR code URI for the authenticated user.
 * @returns Generate2FAResponse containing the secret and QR code data URI.
 */
export const generate2FASecret = async (): Promise<Generate2FAResponse> => {
	try {
		const response = await apiClient.get<Generate2FAResponse>('/api/v1/auth/2fa/generate');
		console.log('2FA secret generated.');
		console.log('generate2FASecret returning:', response.data); // Log what's being returned
		return response.data;
	} catch (error) {
		console.error('Error generating 2FA secret:', error);
		throw error;
	}
};

/**
 * Enables 2FA for the authenticated user by verifying the initial TOTP code.
 * @param data The verification code (Verify2FARequest).
 * @returns TwoFactorRecoveryCodesResponse containing recovery codes.
 */
export const enable2FA = async (data: Verify2FARequest): Promise<TwoFactorRecoveryCodesResponse> => {
	try {
		const response = await apiClient.post<TwoFactorRecoveryCodesResponse>('/api/v1/auth/2fa/enable', data);
		console.log('2FA enabled successfully.');
		return response.data;
	} catch (error) {
		console.error('Error enabling 2FA:', error);
		throw error;
	}
};

/**
 * Disables 2FA for the authenticated user. Requires password or current TOTP code.
 * @param data Verification data (Disable2FARequest).
 */
export const disable2FA = async (data: Disable2FARequest): Promise<void> => {
	try {
		await apiClient.post('/api/v1/auth/2fa/disable', data);
		console.log('2FA disabled successfully.');
	} catch (error) {
		console.error('Error disabling 2FA:', error);
		throw error;
	}
};

/**
 * Verifies a login link token for passwordless authentication.
 * @param data The token from the login link (VerifyLoginLinkInput).
 * @param context The context mode for login link verification ('global' | 'tenant' | 'auto').
 * @param preserveGlobalContext Whether to preserve global context.
 * @returns A LoginOutput containing tokens and user data upon success.
 */
export const verifyLoginLink = async (
	data: VerifyLoginLinkInput,
	context: ContextMode = 'auto',
	preserveGlobalContext: boolean = true
): Promise<LoginOutput> => {
	try {
		// Add context information to the request
		const requestData = {
			...data,
			context_mode: context,
			preserve_global_context: preserveGlobalContext
		};

		const response = await apiClient.post<LoginOutput>('/api/v1/auth/login/verify-link', requestData);
		// AuthContext will handle storing tokens and user state
		return response.data;
	} catch (error) {
		console.error('Error verifying login link:', error);
		throw error;
	}
};

/**
 * Requests a login link to be sent to the user's email for passwordless authentication.
 * @param data The email and optional tenant slug (RequestLoginLinkInput).
 * @returns Promise<void>
 */
export const requestLoginLink = async (data: RequestLoginLinkInput): Promise<void> => {
	try {
		await apiClient.post('/api/v1/auth/login/request-link', data);
		console.log('Request login link email sent.');
	} catch (error) {
		console.error('Error requesting login link:', error);
		throw error;
	}
};

/**
 * Resends the email verification link to the authenticated user's email.
 * @returns Promise<void>
 */
export const resendVerificationEmail = async (): Promise<void> => {
	try {
		await apiClient.post('/api/v1/auth/email/resend-verify');
		console.log('Verification email resent successfully.');
	} catch (error) {
		console.error('Error resending verification email:', error);
		throw error;
	}
};

/**
 * Login the active tenant context for the authenticated user.
 * @param tenantId The ID of the tenant to switch to.
 * @param preserveGlobalContext Whether to preserve global context when switching to tenant.
 * @param validateContext Whether to validate the context switch before executing.
 * @returns A ContextSwitchResult containing new tokens and context information.
 */
export const loginTenantContext = async (
	tenantId: string,
	preserveGlobalContext: boolean = true,
	validateContext: boolean = true
): Promise<ContextSwitchResult> => {
	try {
		// Skip validation if already in tenant context with the same tenant ID
		const currentMode = contextManager.getCurrentMode()
		const currentTenantState = contextManager.getContextState('tenant')

		console.log(`🔄 Login tenant context - Current mode: ${currentMode}, Target tenant: ${tenantId}`)

		if (currentMode === 'tenant' && currentTenantState?.tenantId === tenantId) {
			console.log(`✅ Already in tenant ${tenantId} context, skipping login-tenant API call`)
			return {
				success: true,
				previousMode: 'global' as ContextMode,
				newMode: 'tenant' as ContextMode,
				rollbackAvailable: preserveGlobalContext
			}
		}

		// Validate context switch if requested and not already in target context
		if (validateContext) {
			// When switching TO tenant context, validate the CURRENT context (usually global)
			// Don't validate tenant context since we're trying to CREATE it
			const currentContextValidation = contextManager.validateContext(currentMode as ContextMode);
			if (!currentContextValidation.isValid) {
				console.warn(`Current ${currentMode} context validation failed:`, currentContextValidation.errors);
				// Only throw error if it's a critical validation failure
				const criticalErrors = currentContextValidation.errors.filter(error =>
					!error.includes('No state found') && !error.includes('expired')
				);
				if (criticalErrors.length > 0) {
					throw new Error(`Context switch validation failed: ${criticalErrors.join(', ')}`);
				}
			}
		}

		// Prepare request data - backend only needs tenant_id
		const requestData = {
			tenant_id: tenantId
		};

		console.log(`📡 Calling login-tenant API for tenant: ${tenantId}`)

		// Call backend login-tenant API
		const response = await apiClient.post<{
			access_token: string,
			refresh_token: string,
			expires_at: string,
			expires_in: number,
			token_type: string
		}>('/api/v1/auth/login-tenant', requestData);

		// Store tenant tokens
		if (response.data && response.data.access_token) {
			console.log(`💾 Storing tenant tokens for tenant: ${tenantId}`)

			// Store new tenant tokens using both managers for compatibility
			tokenManager.setTokens('tenant', response.data.access_token, response.data.refresh_token || null);
			multiTenantTokenManager.setTenantTokens(tenantId, response.data.access_token, response.data.refresh_token || null);

			// Update context state with tenant ID to ensure X-Tenant-ID header is added
			contextManager.setContextState('tenant', {
				user: null, // Will be updated by AuthContext after decoding token
				isAuthenticated: true,
				tenantId: tenantId,
				permissions: [],
				roles: [],
				tokens: {
					accessToken: response.data.access_token,
					refreshToken: response.data.refresh_token || null,
					timestamp: Date.now()
				}
			});

			console.log(`✅ Tenant context switched successfully to tenant ${tenantId}.`);
			return {
				success: true,
				previousMode: 'global' as ContextMode,
				newMode: 'tenant' as ContextMode,
				rollbackAvailable: preserveGlobalContext
			};
		} else {
			throw new Error('Invalid response from login-tenant API');
		}
	} catch (error) {
		console.error('Error switching tenant context:', error);
		throw error; // Re-throw to be handled by the caller (AuthContext)
	}
};

/**
 * Switch back to global context from tenant context.
 * @param preserveTenantContext Whether to preserve tenant context when switching to global.
 * @param validateContext Whether to validate the context switch before executing.
 * @returns A ContextSwitchResult containing new tokens and context information.
 */
export const loginGlobalContext = async (
	preserveTenantContext: boolean = false,
	validateContext: boolean = true
): Promise<ContextSwitchResult> => {
	try {
		// Validate context switch if requested
		if (validateContext) {
			// When switching TO global context, validate the CURRENT context (usually tenant)
			// Don't validate global context since we're trying to CREATE/REFRESH it
			const currentMode = contextManager.getCurrentMode();
			const currentContextValidation = contextManager.validateContext(currentMode as ContextMode);
			if (!currentContextValidation.isValid) {
				console.warn(`Current ${currentMode} context validation failed:`, currentContextValidation.errors);
				// Only throw error if it's a critical validation failure
				const criticalErrors = currentContextValidation.errors.filter(error =>
					!error.includes('No state found') && !error.includes('expired')
				);
				if (criticalErrors.length > 0) {
					throw new Error(`Context switch validation failed: ${criticalErrors.join(', ')}`);
				}
			}
		}

		// Prepare request data with context information
		const requestData = {
			preserve_tenant_context: preserveTenantContext,
			context_mode: 'global' as ContextMode
		};

		// Backend returns AuthResult, not ContextSwitchResult
		const response = await apiClient.post<{ access_token: string, refresh_token: string, expires_at: string, expires_in: number, token_type: string }>('/api/v1/auth/login-global', requestData);

		// Convert AuthResult to ContextSwitchResult format
		if (response.data && response.data.access_token) {
			console.log('Global context switched successfully.');
			return {
				success: true,
				previousMode: 'tenant' as ContextMode,
				newMode: 'global' as ContextMode,
				rollbackAvailable: preserveTenantContext
			};
		} else {
			throw new Error('Invalid response from login-global API');
		}
	} catch (error) {
		console.error('Error switching global context:', error);
		throw error; // Re-throw to be handled by the caller (AuthContext)
	}
};

/**
 * Get context-aware API client with appropriate headers for the specified context.
 * @param context The context mode to get API client for.
 * @returns API client configured for the specified context.
 */
export const getContextAwareApiClient = (context: ContextMode = 'auto') => {
	const tokens = tokenManager.getTokens(context);

	// Create a new axios instance with context-specific headers
	const contextApiClient = axios.create({
		baseURL: apiClient.defaults.baseURL,
		timeout: apiClient.defaults.timeout,
		headers: {
			...apiClient.defaults.headers,
			'X-Context-Mode': context
		}
	});

	if (tokens.accessToken) {
		contextApiClient.defaults.headers.Authorization = `Bearer ${tokens.accessToken}`;
	}

	if (context === 'tenant') {
		const contextState = contextManager.getContextState('tenant');
		if (contextState?.tenantId) {
			contextApiClient.defaults.headers['X-Tenant-ID'] = contextState.tenantId;
		}
	}

	return contextApiClient;
};

/**
 * Validate and refresh context if needed.
 * @param context The context to validate and refresh.
 * @returns Promise<boolean> indicating if context is valid and refreshed.
 */
export const validateAndRefreshContext = withErrorHandling(
	async (context: ContextMode): Promise<boolean> => {
		const validation = await contextManager.validateContext(context);

		if (!validation.isValid) {
			console.warn('Context validation failed:', validation.errors);
			return false;
		}

		// If context is valid but tokens are expired, try to refresh
		const tokens = tokenManager.getTokens(context);
		if (tokens.refreshToken && !tokens.accessToken) {
			try {
				await refreshToken(tokens.refreshToken, context);
				return true;
			} catch (error) {
				console.error('Failed to refresh context tokens:', error);
				return false;
			}
		}

		return true;
	}
);
