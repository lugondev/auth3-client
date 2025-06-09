

// --- Start: Backend Type Definitions ---

// Based on internal/modules/account/domain/models.go
export type UserStatus = "active" | "pending" | "suspended" | "deleted";

// Based on internal/modules/account/domain/role.go
// Assuming Permission is a string for simplicity, adjust if it's more complex
export type Permission = string;

export interface RoleResponse {
	roles: string[]
}

// Based on internal/modules/account/domain/user_dto.go and models.go
export interface UserOutput {
	id: string; // uuid.UUID
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
	tenant_slug?: string; // Added tenant_slug as optional
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
	qr_code_uri: string; // Data URI for QR code image (Corrected to snake_case)
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

// Input DTOs for User operations (Keep existing)
export interface UpdateUserInput {
	first_name?: string;
	last_name?: string;
	phone?: string;
	status?: UserStatus; // Make optional for partial updates
}

// Added for user update requests
export interface UpdateUserRequest {
	first_name?: string;
	last_name?: string;
	phone?: string;
	status?: UserStatus; // Updated based on user feedback
	// Add other fields that can be updated via the API
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


// Paginated results for users and roles
export interface PaginatedUsers {
	users: UserOutput[];
	total: number; // Assuming int64 maps to number
	page: number;
	page_size: number;
	total_pages: number;
}

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