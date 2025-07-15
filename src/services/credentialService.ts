/**
 * Credential Service - API interactions for verifiable credentials
 */

import { JSONValue } from '@/types/template';
import apiClient from '@/lib/apiClient';
import { dateStringToRFC3339 } from '@/utils/dateUtils';

const API_BASE_URL = '/api/v1/credentials';

// Request/Response Types for Credential Issuance
export interface IssueCredentialRequest {
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

export interface BulkIssueRequest {
	templateId: string;
	recipients: Array<{
		credentialSubject: Record<string, JSONValue>;
		recipientDID?: string;
		recipientEmail?: string;
		metadata?: Record<string, JSONValue>;
	}>;
	issuanceDate?: string;
	expirationDate?: string;
	additionalContext?: string[];
}

export interface BulkIssueResponse {
	batchId: string;
	totalRequests: number;
	successCount: number;
	failureCount: number;
	results: Array<{
		index: number;
		success: boolean;
		credentialId?: string;
		error?: string;
	}>;
}

export interface CredentialListFilters {
	page?: number;
	limit?: number;
	status?: string;
	templateId?: string;
	issuerDID?: string;
	recipientDID?: string;
	issuedAfter?: string;
	issuedBefore?: string;
	search?: string;
}

export interface CredentialListResponse {
	credentials: VerifiableCredential[];
	total: number;
	page: number;
	limit: number;
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

// Verification Types
export interface VerifyCredentialRequest {
	credential: VerifiableCredential;
}

export interface VerificationResults {
	signatureValid: boolean;
	notExpired: boolean;
	notRevoked: boolean;
	issuerTrusted: boolean;
	schemaValid: boolean;
	proofValid: boolean;
	message?: string;
}

export interface VerifyCredentialResponse {
	valid: boolean;
	verificationResults: VerificationResults;
	errors?: string[];
	warnings?: string[];
	verifiedAt: string;
}

export interface ValidationResult {
	valid: boolean;
	errors?: string[];
	warnings?: string[];
}

class CredentialService {
	// Issue a single credential
	async issueCredential(request: IssueCredentialRequest): Promise<IssueCredentialResponse> {
		// Convert date formats from YYYY-MM-DD to RFC3339 before sending to backend
		const convertedRequest = {
			templateID: request.templateId, // Backend expects templateID (capital D)
			issuerDID: request.issuerDID, // Include issuer DID in request
			subjectDID: request.recipientDID || undefined, // Send DID if available
			recipientEmail: request.recipientEmail || undefined, // Send email if available
			credentialSubject: request.credentialSubject,
			issuanceDate: request.issuanceDate ? dateStringToRFC3339(request.issuanceDate) : undefined,
			expirationDate: request.expirationDate ? dateStringToRFC3339(request.expirationDate) : undefined,
			additionalContext: request.additionalContext || undefined,
			metadata: request.metadata,
		};

		console.log('CredentialService.issueCredential - sending request:', convertedRequest);

		const response = await apiClient.post<IssueCredentialResponse>(`${API_BASE_URL}/templates/issue`, convertedRequest);
		return response.data;
	}

	// Issue multiple credentials in bulk
	async bulkIssueCredentials(request: BulkIssueRequest): Promise<BulkIssueResponse> {
		// Convert date formats from YYYY-MM-DD to RFC3339 before sending to backend
		const convertedRequest = {
			...request,
			issuanceDate: request.issuanceDate ? dateStringToRFC3339(request.issuanceDate) : undefined,
			expirationDate: request.expirationDate ? dateStringToRFC3339(request.expirationDate) : undefined,
		};

		const response = await apiClient.post<BulkIssueResponse>(`${API_BASE_URL}/bulk-issue`, convertedRequest);
		return response.data;
	}

	// Get a specific credential by ID
	async getCredential(id: string): Promise<VerifiableCredential> {
		const response = await apiClient.get<VerifiableCredential>(`${API_BASE_URL}/${id}`);
		return response.data;
	}

	// List credentials with filtering
	async listCredentials(filters: CredentialListFilters = {}): Promise<CredentialListResponse> {
		const params = new URLSearchParams();

		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				params.append(key, String(value));
			}
		});

		const url = `${API_BASE_URL}?${params.toString()}`;
		const response = await apiClient.get<CredentialListResponse>(url);
		return response.data;
	}

	// Revoke a credential
	async revokeCredential(id: string, reason?: string): Promise<void> {
		await apiClient.post(`${API_BASE_URL}/${id}/revoke`, { reason });
	}

	// Validate credential data against template schema
	async validateCredentialData(templateId: string, data: Record<string, JSONValue>): Promise<ValidationResult> {
		const response = await apiClient.post<ValidationResult>(`/api/v1/credentials/templates/${templateId}/validate-data`, { data });
		return response.data;
	}

	// Download credential as PDF/JSON
	async downloadCredential(id: string, format: 'pdf' | 'json' = 'json'): Promise<void> {
		const response = await apiClient.get(`${API_BASE_URL}/${id}/download?format=${format}`, {
			responseType: 'blob'
		});

		const blob = response.data as Blob;
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `credential-${id}.${format}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// Upload CSV for bulk issuance
	async uploadBulkIssuanceCSV(file: File, templateId: string): Promise<BulkIssueResponse> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('templateId', templateId);

		const response = await apiClient.post<BulkIssueResponse>(`${API_BASE_URL}/bulk-issue/csv`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});

		return response.data;
	}

	// Get bulk issuance status
	async getBulkIssuanceStatus(batchId: string): Promise<BulkIssueResponse> {
		const response = await apiClient.get<BulkIssueResponse>(`${API_BASE_URL}/bulk-issue/${batchId}/status`);
		return response.data;
	}

	// Preview credential before issuance
	async previewCredential(request: IssueCredentialRequest): Promise<VerifiableCredential> {
		// Convert date formats from YYYY-MM-DD to RFC3339 before sending to backend
		const convertedRequest = {
			...request,
			issuanceDate: request.issuanceDate ? dateStringToRFC3339(request.issuanceDate) : undefined,
			expirationDate: request.expirationDate ? dateStringToRFC3339(request.expirationDate) : undefined,
		};

		const response = await apiClient.post<VerifiableCredential>(`${API_BASE_URL}/preview`, convertedRequest);
		return response.data;
	}

	// Verify a credential
	async verifyCredential(request: VerifyCredentialRequest): Promise<VerifyCredentialResponse> {
		const response = await apiClient.post<VerifyCredentialResponse>(`${API_BASE_URL}/verify`, request);
		return response.data;
	}
}

export const credentialService = new CredentialService();
export default credentialService;
