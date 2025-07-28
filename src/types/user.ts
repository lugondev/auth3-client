

// --- Start: Backend Type Definitions ---

import { EntityWithMetadata, BaseStatus, UpdateInput } from './generics';

// Based on internal/modules/account/domain/models.go
export type UserStatus = "active" | "pending" | "suspended" | "deleted";

// Generic user status extending base status
export type ExtendedUserStatus = BaseStatus | "pending" | "deleted";

// Based on internal/modules/account/domain/role.go


export interface RoleResponse {
	roles: string[]
}

// Based on internal/modules/account/domain/user_dto.go and models.go
export interface UserOutput extends EntityWithMetadata {
	email: string;
	first_name: string;
	last_name: string;
	phone?: string;
	avatar?: string;
	roles?: string[];
	status: UserStatus;
	email_verified_at?: string | null; // Reverted back to timestamp
	phone_verified_at?: string | null; // Reverted back to timestamp
	is_two_factor_enabled: boolean; // Added for 2FA status
	is_email_verified: boolean;
	is_phone_verified: boolean;
	profile?: UserProfile | null; // Added optional profile field
}

export interface UserPreferences {
	email_notifications?: boolean;
	push_notifications?: boolean;
	language?: string;
	theme?: string;
}

export interface UserProfile extends EntityWithMetadata {
	user_id: string; // uuid.UUID
	bio?: string;
	date_of_birth?: string | null; // time.Time can be null/zero
	address?: string;
	interests?: string[];
	preferences?: UserPreferences; // Can be optional or have defaults
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
	tenant?: string; // Optional tenant slug or ID - matches backend field
}

export interface SocialTokenExchangeInput {
	token?: string; // The ID token from the social provider (e.g., Firebase)
	id_token?: string; // Alternative ID token field for social providers
	provider: string; // Added provider field, e.g., "firebase", "google"
}

export interface VerifyLoginLinkInput {
	token: string;
}

export interface RequestLoginLinkInput {
	email: string;
	tenant_slug?: string;
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

// --- Phone Verification DTOs ---
export interface VerifyPhoneInput {
	otp: string;
}

// --- 2FA DTOs ---
export interface Generate2FAResponse {
	secret: string;
	qr_code_uri: string; // otpauth:// URI that needs to be converted to QR code image on frontend
}

// Removed the empty interface definition above

// Added based on API spec for POST /api/v1/auth/login/verify-2fa
export interface Verify2FARequest {
	two_factor_session_token: string; // The token received from the initial login step
	code: string; // The TOTP code from the authenticator app
}

export interface TwoFactorRecoveryCodesResponse {
	recovery_codes: string[];
}

export interface Disable2FARequest {
	password?: string; // Optional: Current user password
	code?: string; // Optional: Current TOTP code
}

// Input DTOs for User operations using generic types
export type UpdateUserInput = UpdateInput<Pick<UserOutput, 'first_name' | 'last_name' | 'phone' | 'status'>>;

// Alias for backward compatibility
export type UpdateUserRequest = UpdateUserInput;

export type UpdateProfileInput = UpdateInput<Pick<UserProfile, 'bio' | 'date_of_birth' | 'address' | 'interests' | 'preferences' | 'metadata'>>;

export interface UpdatePasswordInput {
	current_password: string;
	new_password: string;
	otp_code?: string; // Optional: Required if 2FA is enabled
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

// Added based on API spec for POST /api/v1/auth/login and POST /api/v1/auth/login/verify-2fa
export interface LoginOutput {
	user?: UserOutput; // User details might be returned
	auth?: AuthResult | null; // Auth tokens (null if 2FA is required initially)
	two_factor_required: boolean; // Flag indicating if 2FA step is needed
	two_factor_session_token?: string; // Token for the 2FA verification step (only if two_factor_required is true)
}


// Paginated results for users using generic types
export interface PaginatedUsers {
	users: UserOutput[];
	total: number; // Assuming int64 maps to number
	page: number;
	page_size: number;
	total_pages: number;
	has_previous: boolean;
	has_next: boolean;
}

// Alternative using generic pagination
export type PaginatedUsersGeneric = import('./generics').LegacyPaginatedResponse<UserOutput>;

// Search query parameters
export interface UserSearchQuery {
	query?: string;
	status?: UserStatus;
	role_name?: string; // uuid.UUID
	offset?: number;
	limit?: number;
}

// Type for UpdatePasswordResponse in user_handler.go
export interface UpdatePasswordResponse {
	message: string;
}