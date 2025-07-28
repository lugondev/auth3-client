/**
 * Tenant Credential Service - API interactions for tenant-specific verifiable credentials
 */

import { JSONValue } from '@/types/template';
import apiClient from '@/lib/apiClient';
import { dateStringToRFC3339 } from '@/utils/dateUtils';
import type {
	BulkIssueCredentialRequest,
	BulkIssueCredentialResponse,
} from '@/types/credentials'
import {
	validateCSVFile as validateCSVUtil,
	downloadCSVTemplate as downloadCSVUtil,
} from '@/utils/csvUtils'

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
	subjectDID: string;
	issuanceDate: string;
	issuedAt?: string;
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

/**
 * Lists credentials for a specific tenant with optional filtering and pagination.
 * @param {string} tenantId - The tenant ID
 * @param {object} query - Query parameters for filtering and pagination
 * @returns {Promise<object>} The paginated list of credentials
 */
export const listCredentials = async (tenantId: string, query?: {
	page?: number;
	limit?: number;
	status?: string;
	type?: string;
	search?: string;
	issuer?: string;
	subject?: string;
}): Promise<{
	credentials: VerifiableCredential[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}> => {
	if (!tenantId) {
		throw new Error('Tenant ID is required to list credentials.');
	}

	const params = new URLSearchParams();
	if (query) {
		if (query.page) params.append('page', query.page.toString());
		if (query.limit) params.append('limit', query.limit.toString());
		if (query.status) params.append('status', query.status);
		if (query.type) params.append('type', query.type);
		if (query.search) params.append('search', query.search);
		if (query.issuer) params.append('issuer', query.issuer);
		if (query.subject) params.append('subject', query.subject);
	}

	const queryString = params.toString();
	const url = queryString ? `/api/v1/tenants/${tenantId}/credentials?${queryString}` : `/api/v1/tenants/${tenantId}/credentials`;

	const response = await apiClient.get<{
		credentials: VerifiableCredential[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
	}>(url);
	return response.data;
};

/**
 * Gets a specific credential by its ID for a tenant.
 * @param {string} tenantId - The tenant ID
 * @param {string} credentialId - The credential ID
 * @returns {Promise<VerifiableCredential>} The credential
 */
export const getCredential = async (tenantId: string, credentialId: string): Promise<VerifiableCredential> => {
	if (!tenantId) {
		throw new Error('Tenant ID is required to get a credential.');
	}
	if (!credentialId) {
		throw new Error('Credential ID is required to get a credential.');
	}

	const response = await apiClient.get<VerifiableCredential>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}`);
	return response.data;
};

/**
 * Revokes a credential by its ID for a tenant.
 * @param {string} tenantId - The tenant ID
 * @param {string} credentialId - The credential ID
 * @param {object} input - Revocation details
 * @returns {Promise<void>} 
 */
export const revokeCredential = async (tenantId: string, credentialId: string, input: {
	issuerDID: string;
	reason?: string;
}): Promise<void> => {
	if (!tenantId) {
		throw new Error('Tenant ID is required to revoke a credential.');
	}
	if (!credentialId) {
		throw new Error('Credential ID is required to revoke a credential.');
	}

	await apiClient.post(`/api/v1/tenants/${tenantId}/credentials/${credentialId}/revoke`, {
		issuerDID: input.issuerDID,
		reason: input.reason || 'Revoked by issuer'
	});
};

// Other tenant-specific credential functions can be added here, e.g.,
// - verifyTenantCredential

// ============ Bulk Credential Operations ============

export interface TenantBulkIssueCredentialRequest extends Omit<BulkIssueCredentialRequest, 'tenantId'> {
	tenantId?: string; // Will be extracted from URL params
}

export interface BulkIssueCSVUploadRequest {
	templateId: string
	issuerDid: string
	file: File
}

/**
 * Issues multiple verifiable credentials in bulk for a specific tenant.
 * @param {string} tenantId - The tenant ID
 * @param {TenantBulkIssueCredentialRequest} request - The bulk issuance request
 * @returns {Promise<BulkIssueCredentialResponse>} The bulk issuance response
 */
export const bulkIssueCredentials = async (
	tenantId: string,
	request: TenantBulkIssueCredentialRequest
): Promise<BulkIssueCredentialResponse> => {
	if (!tenantId) {
		throw new Error('Tenant ID is required to issue credentials in bulk.');
	}

	if (!request.recipients || request.recipients.length === 0) {
		throw new Error('At least one recipient is required for bulk issuance.');
	}

	if (request.recipients.length > 1000) {
		throw new Error('Maximum 1000 recipients allowed per batch.');
	}

	const payload = {
		...request,
		issuanceDate: request.issuanceDate ? dateStringToRFC3339(request.issuanceDate) : undefined,
		expirationDate: request.expirationDate ? dateStringToRFC3339(request.expirationDate) : undefined,
	};

	const response = await apiClient.post<BulkIssueCredentialResponse>(
		`/api/v1/tenants/${tenantId}/credentials/bulk-issue`,
		payload
	);
	return response.data;
};

/**
 * Gets the status of a bulk credential issuance operation.
 * @param {string} tenantId - The tenant ID
 * @param {string} batchId - The batch ID from the bulk issuance response
 * @returns {Promise<BulkIssueCredentialResponse>} The current status of the bulk operation
 */
export const getBulkIssueStatus = async (tenantId: string, batchId: string): Promise<BulkIssueCredentialResponse> => {
	if (!tenantId) {
		throw new Error('Tenant ID is required to get bulk issue status.');
	}

	if (!batchId) {
		throw new Error('Batch ID is required to get bulk issue status.');
	}

	const response = await apiClient.get<BulkIssueCredentialResponse>(
		`/api/v1/tenants/${tenantId}/credentials/bulk-issue/${batchId}/status`
	);
	return response.data;
};

/**
 * Issues credentials in bulk from a CSV file for a specific tenant.
 * @param {string} tenantId - The tenant ID
 * @param {BulkIssueCSVUploadRequest} request - The CSV upload request
 * @returns {Promise<BulkIssueCredentialResponse>} The bulk issuance response
 */
export const bulkIssueFromCSV = async (
	tenantId: string,
	request: BulkIssueCSVUploadRequest
): Promise<BulkIssueCredentialResponse> => {
	if (!tenantId) {
		throw new Error('Tenant ID is required to issue credentials from CSV.');
	}

	if (!request.file) {
		throw new Error('CSV file is required for bulk issuance.');
	}

	// Validate file type
	if (!request.file.name.endsWith('.csv')) {
		throw new Error('File must be a CSV file.');
	}

	// Validate file size (10MB limit)
	if (request.file.size > 10 * 1024 * 1024) {
		throw new Error('File size must be less than 10MB.');
	}

	const formData = new FormData();
	formData.append('file', request.file);
	formData.append('templateId', request.templateId);
	formData.append('issuerDid', request.issuerDid);

	const response = await apiClient.post<BulkIssueCredentialResponse>(
		`/api/v1/tenants/${tenantId}/credentials/bulk-issue/csv`,
		formData,
		{
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		}
	);
	return response.data;
};

/**
 * Downloads a CSV template for bulk credential issuance.
 * @returns {string} CSV template content
 */
export const downloadCSVTemplate = (): string => {
	return downloadCSVUtil()
};

/**
 * Validates CSV data before uploading.
 * @param {File} file - The CSV file to validate
 * @returns {Promise<{valid: boolean; errors: string[]}>} Validation result
 */
export const validateCSVFile = async (file: File): Promise<{ valid: boolean; errors: string[] }> => {
	const result = await validateCSVUtil(file)
	return {
		valid: result.valid,
		errors: result.errors,
	}
};
