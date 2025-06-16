import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';

// DID Authentication Types
export interface DIDAuthInitiateRequest {
	did: string;
	challenge_type?: 'signature' | 'presentation';
	verification_method?: string;
}

export interface DIDAuthInitiateResponse {
	challenge: string;
	challenge_id: string;
	expires_at: string;
	verification_method?: string;
}

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

export interface DIDChallengeRequest {
	did: string;
	challenge_type?: 'signature' | 'presentation';
}

export interface DIDChallengeResponse {
	challenge: string;
	challenge_id: string;
	expires_at: string;
}

export interface DIDVerifyRequest {
	challenge_id: string;
	signature: string;
	verification_method: string;
}

export interface DIDVerifyResponse {
	valid: boolean;
	did: string;
	verification_method: string;
	message?: string;
}

export interface DIDValidateSignatureRequest {
	did: string;
	message: string;
	signature: string;
	verification_method: string;
}

export interface DIDValidateSignatureResponse {
	valid: boolean;
	did: string;
	verification_method: string;
	message?: string;
}

/**
 * Initiate DID authentication process
 */
export const initiateDIDAuth = withErrorHandling(
	async (request: DIDAuthInitiateRequest): Promise<DIDAuthInitiateResponse> => {
		const response = await apiClient.post<DIDAuthInitiateResponse>(
			'/api/v1/auth/did/initiate',
			request
		);
		return response.data;
	}
);

/**
 * Complete DID authentication process
 */
export const completeDIDAuth = withErrorHandling(
	async (request: DIDAuthCompleteRequest): Promise<DIDAuthCompleteResponse> => {
		const response = await apiClient.post<DIDAuthCompleteResponse>(
			'/api/v1/auth/did/complete',
			request
		);
		return response.data;
	}
);

/**
 * Generate DID challenge
 */
export const generateDIDChallenge = withErrorHandling(
	async (request: DIDChallengeRequest): Promise<DIDChallengeResponse> => {
		const response = await apiClient.post<DIDChallengeResponse>(
			'/api/v1/auth/did/challenge',
			request
		);
		return response.data;
	}
);

/**
 * Verify DID challenge response
 */
export const verifyDIDChallenge = withErrorHandling(
	async (request: DIDVerifyRequest): Promise<DIDVerifyResponse> => {
		const response = await apiClient.post<DIDVerifyResponse>(
			'/api/v1/auth/did/verify',
			request
		);
		return response.data;
	}
);

/**
 * Validate DID signature
 */
export const validateDIDSignature = withErrorHandling(
	async (request: DIDValidateSignatureRequest): Promise<DIDValidateSignatureResponse> => {
		const response = await apiClient.post<DIDValidateSignatureResponse>(
			'/api/v1/auth/did/validate-signature',
			request
		);
		return response.data;
	}
);