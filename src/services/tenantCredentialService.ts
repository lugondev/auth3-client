/**
 * Tenant Credential Service - API interactions for tenant-specific verifiable credentials
 */

import { JSONValue } from '@/types/template';
import apiClient from '@/lib/apiClient';
import { dateStringToRFC3339 } from '@/utils/dateUtils';

// Request/Response Types for Credential Issuance
export interface IssueCredentialRequest {
	tenantId: string;
	templateId: string;
	credentialSubject: Record<string, JSONValue>;
	issuerDID: string;
	recipientDID?: string;
	recipientEmail?: string;
	issuanceDate?: string;
	expirationDate?: string;
	additionalContext?: string[];
	metadata?: Record<string, JSONValue>;
}

export interface IssueCredentialResponse {
	id: string;
	credential: VerifiableCredential;
	status: 'issued' | 'pending' | 'failed';
	message?: string;
}

// Simplified VerifiableCredential type for this service
export interface VerifiableCredential {
	'@context': string[];
	id: string;
	type: string[];
	issuer: string;
	issuanceDate: string;
	expirationDate?: string;
	credentialSubject: Record<string, JSONValue>;
	credentialStatus?: {
		id: string;
		type: string;
		status: 'active' | 'revoked' | 'suspended';
	};
	proof?: {
		type: string;
		created: string;
		verificationMethod: string;
		proofPurpose: string;
		proofValue: string;
	};
	metadata?: Record<string, JSONValue>;
}


/**
 * Issues a new verifiable credential for a specific tenant.
 * @param {IssueCredentialRequest} request - The details for the credential to be issued.
 * @returns {Promise<IssueCredentialResponse>} The response from the API.
 */
export const issueCredential = async (request: IssueCredentialRequest): Promise<IssueCredentialResponse> => {
	const { tenantId, ...rest } = request;
	if (!tenantId) {
		throw new Error('Tenant ID is required to issue a credential.');
	}

	const payload = {
		...rest,
		issuanceDate: request.issuanceDate ? dateStringToRFC3339(request.issuanceDate) : undefined,
		expirationDate: request.expirationDate ? dateStringToRFC3339(request.expirationDate) : undefined,
	};

	const response = await apiClient.post<IssueCredentialResponse>(`/api/v1/tenants/${tenantId}/credentials`, payload);
	return response.data;
};

// Other tenant-specific credential functions can be added here, e.g.,
// - listTenantCredentials
// - getTenantCredentialById
// - revokeTenantCredential
