// DID Authentication Types for Auth3 Client

/**
 * Request to initiate DID authentication process
 */
export interface DIDAuthInitiateRequest {
	did: string;
	challenge_type?: 'signature' | 'presentation';
	verification_method?: string;
}

/**
 * Response from DID authentication initiation
 */
export interface DIDAuthInitiateResponse {
	challenge: string;
	challenge_id: string;
	expires_at: string;
	verification_method?: string;
}

/**
 * Request to complete DID authentication process
 */
export interface DIDAuthCompleteRequest {
	challenge_id: string;
	response: string;
	proof?: {
		type: string;
		created: string;
		verification_method: string;
		proof_purpose: string;
		jws?: string;
		signature?: string;
	};
}

/**
 * Response from DID authentication completion
 */
export interface DIDAuthCompleteResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	user: {
		id: string;
		did: string;
		email?: string;
		name?: string;
		roles: string[];
		permissions: string[];
	};
}

/**
 * Request to generate DID challenge
 */
export interface DIDChallengeRequest {
	did: string;
	challenge_type?: 'signature' | 'presentation';
}

/**
 * Response from DID challenge generation
 */
export interface DIDChallengeResponse {
	challenge: string;
	challenge_id: string;
	expires_at: string;
}

/**
 * Request to verify DID challenge response
 */
export interface DIDVerifyRequest {
	challenge_id: string;
	signature: string;
	verification_method: string;
}

/**
 * Response from DID challenge verification
 */
export interface DIDVerifyResponse {
	valid: boolean;
	did: string;
	verification_method: string;
	message?: string;
}

/**
 * Request to validate DID signature
 */
export interface DIDValidateSignatureRequest {
	did: string;
	message: string;
	signature: string;
	verification_method: string;
}

/**
 * Response from DID signature validation
 */
export interface DIDValidateSignatureResponse {
	valid: boolean;
	did: string;
	verification_method: string;
	message?: string;
}