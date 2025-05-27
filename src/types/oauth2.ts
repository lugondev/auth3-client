export interface ClientRegistrationRequest {
	name: string;
	description?: string;
	redirect_uris: string[];
	grant_types: string[];
	response_types: string[];
	scopes: string[];
	client_uri?: string;
	logo_uri?: string;
	tos_uri?: string;
	policy_uri?: string;
	jwks_uri?: string;
	contacts?: string[];
	token_endpoint_auth_method?: string;
	subject_type?: string;
	sector_identifier_uri?: string;
	id_token_signed_response_alg?: string;
	id_token_encrypted_response_alg?: string;
	id_token_encrypted_response_enc?: string;
	userinfo_signed_response_alg?: string;
	userinfo_encrypted_response_alg?: string;
	userinfo_encrypted_response_enc?: string;
	request_object_signing_alg?: string;
	request_object_encryption_alg?: string;
	request_object_encryption_enc?: string;
	require_auth_time?: boolean;
	default_max_age?: number;
	require_nonce?: boolean;
	default_acr_values?: string[];
	initiate_login_uri?: string;
	request_uris?: string[];
}

export interface ClientRegistrationResponse {
	client_id: string;
	client_secret: string;
	client_id_issued_at: number;
	client_secret_expires_at: number;
	registration_access_token: string;
	registration_client_uri: string;
	client_name: string;
	redirect_uris: string[];
	grant_types: string[];
	response_types: string[];
	scopes: string[];
	client_uri?: string;
	logo_uri?: string;
	tos_uri?: string;
	policy_uri?: string;
	jwks_uri?: string;
	contacts?: string[];
	token_endpoint_auth_method?: string;
	subject_type?: string;
	sector_identifier_uri?: string;
	id_token_signed_response_alg?: string;
	id_token_encrypted_response_alg?: string;
	id_token_encrypted_response_enc?: string;
	userinfo_signed_response_alg?: string;
	userinfo_encrypted_response_alg?: string;
	userinfo_encrypted_response_enc?: string;
	request_object_signing_alg?: string;
	request_object_encryption_alg?: string;
	request_object_encryption_enc?: string;
	require_auth_time?: boolean;
	default_max_age?: number;
	require_nonce?: boolean;
	default_acr_values?: string[];
	initiate_login_uri?: string;
	request_uris?: string[];
}

export interface ClientInfo {
	client_id: string;
	client_secret: string;
	client_id_issued_at: number;
	client_secret_expires_at: number;
	name: string;
	description?: string;
	redirect_uris: string[];
	scopes: string[];
	grant_types: string[];
	response_types: string[] | null;
	client_uri?: string;
	logo_uri?: string;
	tos_uri?: string;
	policy_uri?: string;
	token_endpoint_auth_method?: string;
	contacts?: string[];
	subject_type?: string;
	additional_parameters: Record<string, unknown> | null;
	is_public: boolean;
	created_at: string;
}

export interface ClientListResponse {
	clients: ClientInfo[];
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
	id_token?: string;
}

export interface UserInfoResponse {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	picture?: string;
	website?: string;
	email?: string;
	email_verified?: boolean;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	locale?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	address?: Address;
	updated_at?: number;
}

export interface Address {
	formatted?: string;
	street_address?: string;
	locality?: string;
	region?: string;
	postal_code?: string;
	country?: string;
}

export interface AuthorizeResponse {
	code: string;
	state?: string;
}

export interface TokenInfo {
	active: boolean;
	scope?: string;
	client_id?: string;
	username?: string;
	token_type?: string;
	exp?: number;
	iat?: number;
	nbf?: number;
	sub?: string;
	aud?: string | string[];
	iss?: string;
	jti?: string;
}

export interface OpenIDConfiguration {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
	jwks_uri: string;
	registration_endpoint?: string;
	scopes_supported: string[];
	response_types_supported: string[];
	response_modes_supported?: string[];
	grant_types_supported: string[];
	acr_values_supported?: string[];
	subject_types_supported: string[];
	id_token_signing_alg_values_supported: string[];
	id_token_encryption_alg_values_supported?: string[];
	id_token_encryption_enc_values_supported?: string[];
	userinfo_signing_alg_values_supported?: string[];
	userinfo_encryption_alg_values_supported?: string[];
	userinfo_encryption_enc_values_supported?: string[];
	request_object_signing_alg_values_supported?: string[];
	request_object_encryption_alg_values_supported?: string[];
	request_object_encryption_enc_values_supported?: string[];
	token_endpoint_auth_methods_supported: string[];
	token_endpoint_auth_signing_alg_values_supported?: string[];
	display_values_supported?: string[];
	claim_types_supported?: string[];
	claims_supported: string[];
	service_documentation?: string;
	claims_locales_supported?: string[];
	ui_locales_supported?: string[];
	claims_parameter_supported?: boolean;
	request_parameter_supported?: boolean;
	request_uri_parameter_supported?: boolean;
	require_request_uri_registration?: boolean;
	op_policy_uri?: string;
	op_tos_uri?: string;
}

export interface JWKSKey {
	kty: string;
	use?: string;
	key_ops?: string[];
	alg?: string;
	kid?: string;
	x5u?: string;
	x5c?: string[];
	x5t?: string;
	"x5t#S256"?: string;
	n?: string;
	e?: string;
	d?: string;
	p?: string;
	q?: string;
	dp?: string;
	dq?: string;
	qi?: string;
	crv?: string;
	x?: string;
	y?: string;
	k?: string;
}

export interface JWKS {
	keys: JWKSKey[];
}
