import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import {
	DIDAuthInitiateRequest,
	DIDAuthInitiateResponse,
	DIDAuthCompleteRequest,
	DIDAuthCompleteResponse,
	DIDChallengeRequest,
	DIDChallengeResponse,
	DIDVerifyRequest,
	DIDVerifyResponse,
	DIDValidateSignatureRequest,
	DIDValidateSignatureResponse
} from '@/types/didAuth';

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