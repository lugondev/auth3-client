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

// Statistics Types
export interface CredentialStatistics {
	totalCredentials: number;
	activeCredentials: number;
	revokedCredentials: number;
	expiredCredentials: number;
	issuedToday: number;
	issuedThisWeek: number;
	issuedThisMonth: number;
}

// User Credential Analytics Types (for /api/v1/credentials/analytics/me)
export interface UserCredentialAnalyticsFilters {
	start_date?: string; // YYYY-MM-DD format
	end_date?: string;   // YYYY-MM-DD format
	interval?: string;   // day, week, month
	limit?: number;
	offset?: number;
	tenant_id?: string;
	issuer_did?: string;
	tags?: string;       // comma-separated
}

export interface OverviewMetrics {
	total_credentials: number;
	issued_credentials: number;
	active_credentials: number;
	revoked_credentials: number;
	deactivated_credentials: number;
}

export interface IssuanceMetrics {
	total_issued: number;
	issued_today: number;
	issued_this_week: number;
	issued_this_month: number;
	avg_issuance_time_seconds: number;
	most_active_issuance_period: {
		period: string;
		count: number;
		day_of_week: string;
		hour_of_day: number;
		start_date: string;
		end_date: string;
	};
	issuance_timeline: Array<{
		date: string;
		count: number;
	}>;
	issued_by_status: Array<{
		status: string;
		count: number;
		percentage: number;
	}>;
	issued_by_template: Array<{
		template_name: string;
		count: number;
		percentage: number;
	}>;
	issued_by_type: Array<{
		type: string;
		count: number;
		percentage: number;
	}>;
}

export interface ReceivedMetrics {
	total_received: number;
	received_today: number;
	received_this_week: number;
	received_this_month: number;
	verification_success_rate: number;
	most_active_receiving_period: {
		period: string;
		count: number;
		day_of_week: string;
		hour_of_day: number;
		start_date: string | null;
		end_date: string | null;
	};
	received_timeline: Array<{
		date: string;
		count: number;
	}>;
	received_by_status: Array<{
		status: string;
		count: number;
		percentage: number;
	}>;
	received_by_issuer: Array<{
		issuer: string;
		count: number;
		percentage: number;
	}>;
	received_by_type: Array<{
		type: string;
		count: number;
		percentage: number;
	}>;
}

export interface StatusMetrics {
	active_credentials: {
		count: number;
		average_age_days: number;
		expiring_within_30_days: number;
		by_type: Array<{
			type: string;
			count: number;
		}>;
		by_issuer: Array<{
			issuer: string;
			count: number;
		}>;
	};
	revoked_credentials: {
		count: number;
		revoked_today: number;
		revoked_this_week: number;
		revoked_this_month: number;
		by_reason: Array<{
			reason: string;
			count: number;
			percentage: number;
		}>;
		by_type: Array<{
			type: string;
			count: number;
		}>;
		revocation_timeline: Array<{
			date: string;
			count: number;
		}>;
	};
	deactivated_credentials: {
		count: number;
		deactivated_today: number;
		deactivated_this_week: number;
		deactivated_this_month: number;
		by_reason: Array<{
			reason: string;
			count: number;
			percentage: number;
		}>;
		by_type: Array<{
			type: string;
			count: number;
		}>;
		deactivation_timeline: Array<{
			date: string;
			count: number;
		}>;
	};
}

export interface PresentationMetrics {
	total_presentations: number;
	presentations_today: number;
	presentations_this_week: number;
	presentations_this_month: number;
	verification_success_rate: number;
	average_verification_time_hours: number;
	most_active_presentation_period: {
		period: string;
		count: number;
		day_of_week: string;
		hour_of_day: number;
		start_date: string;
		end_date: string;
	};
	presentation_timeline: Array<{
		date: string;
		count: number;
	}>;
	presentations_by_status: Array<{
		status: string;
		count: number;
		percentage: number;
	}>;
}

export interface UserCredentialAnalytics {
	user_id: string;
	generated_at: string;
	period: {
		start_date: string;
		end_date: string;
		interval: string;
	};
	filters_applied: {
		start_date: string;
		end_date: string;
		interval: string;
		limit: number;
		offset: number;
		tenant_id: string | null;
		issuer_did: string;
		tags: string[];
		user_id: string;
	};
	overview_metrics: OverviewMetrics;
	issuance_metrics: IssuanceMetrics;
	received_metrics: ReceivedMetrics;
	status_metrics: StatusMetrics;
	presentation_metrics: PresentationMetrics;
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

	// Get credential statistics (Admin only)
	async getStatistics(): Promise<CredentialStatistics> {
		const response = await apiClient.get<CredentialStatistics>(`${API_BASE_URL}/statistics`);
		return response.data;
	}

	// Get user credential analytics
	async getMyCredentialAnalytics(filters?: UserCredentialAnalyticsFilters): Promise<UserCredentialAnalytics> {
		const params = new URLSearchParams();

		if (filters?.start_date) params.append('start_date', filters.start_date);
		if (filters?.end_date) params.append('end_date', filters.end_date);
		if (filters?.interval) params.append('interval', filters.interval);
		if (filters?.limit) params.append('limit', filters.limit.toString());
		if (filters?.offset) params.append('offset', filters.offset.toString());
		if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
		if (filters?.issuer_did) params.append('issuer_did', filters.issuer_did);
		if (filters?.tags) params.append('tags', filters.tags);

		const queryString = params.toString();
		const url = `${API_BASE_URL}/analytics/me${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<UserCredentialAnalytics>(url);
		return response.data;
	}
}

export const credentialService = new CredentialService();
export default credentialService;
