/**
 * Presentation Service - API interactions for verifiable presentations
 */

import apiClient from '@/lib/apiClient';
import type {
	CreatePresentationRequest,
	CreatePresentationResponse,
	VerifyPresentationRequest,
	VerifyPresentationResponse,
	PresentationListResponse,
	PresentationDetailResponse,
	VerifiablePresentation,
	PresentationFilters
} from '@/types/presentations';

const API_BASE_URL = '/api/v1/presentations';

/**
 * Create a new verifiable presentation
 */
export async function createPresentation(request: CreatePresentationRequest): Promise<CreatePresentationResponse> {
	const response = await apiClient.post(`${API_BASE_URL}/create`, request);
	return response.data as CreatePresentationResponse;
}

/**
 * Get user's presentations with optional filters
 */
export async function getMyPresentations(filters?: PresentationFilters): Promise<PresentationListResponse> {
	try {
		const params = new URLSearchParams();

		if (filters?.status) params.append('status', filters.status);
		if (filters?.purpose) params.append('purpose', filters.purpose);
		if (filters?.verifierDID) params.append('verifier_did', filters.verifierDID);
		if (filters?.limit) params.append('limit', filters.limit.toString());
		if (filters?.offset) params.append('offset', filters.offset.toString());
		if (filters?.sortBy) params.append('sort_by', filters.sortBy);
		if (filters?.sortOrder) params.append('sort_order', filters.sortOrder);

		const queryString = params.toString();
		const url = queryString ? `${API_BASE_URL}?${queryString}` : `${API_BASE_URL}`;

		const response = await apiClient.get(url);
		const data = response.data as PresentationListResponse;

		// Ensure we always return the expected structure
		return {
			presentations: Array.isArray(data?.presentations) ? data.presentations : [],
			pagination: data?.pagination || {
				currentPage: 1,
				pageSize: 20,
				totalItems: 0,
				totalPages: 0,
				hasPrevious: false,
				hasNext: false
			},
			total: data?.total || 0
		};
	} catch (error) {
		console.error('Error fetching presentations:', error);

		// Return empty response structure on error
		return {
			presentations: [],
			pagination: {
				currentPage: 1,
				pageSize: 20,
				totalItems: 0,
				totalPages: 0,
				hasPrevious: false,
				hasNext: false
			},
			total: 0
		};
	}
}

/**
 * Get presentation details by ID
 */
export async function getPresentationById(presentationId: string): Promise<PresentationDetailResponse> {
	const response = await apiClient.get(`${API_BASE_URL}/${presentationId}`);
	return response.data as PresentationDetailResponse;
}

/**
 * Verify a presentation
 */
export async function verifyPresentation(request: VerifyPresentationRequest): Promise<VerifyPresentationResponse> {
	const response = await apiClient.post(`${API_BASE_URL}/verify`, request);
	return response.data as VerifyPresentationResponse;
}

/**
 * Update presentation status
 */
export async function updatePresentationStatus(
	presentationId: string,
	status: 'submitted' | 'verified' | 'rejected'
): Promise<void> {
	await apiClient.patch(`${API_BASE_URL}/${presentationId}/status`, { status });
}

/**
 * Delete a presentation
 */
export async function deletePresentation(presentationId: string): Promise<void> {
	await apiClient.delete(`${API_BASE_URL}/${presentationId}`);
}

/**
 * Share presentation with verifier
 */
export async function sharePresentation(
	presentationId: string,
	verifierDID: string,
	purpose?: string
): Promise<{ shareUrl: string; expiresAt: string }> {
	const response = await apiClient.post(`${API_BASE_URL}/${presentationId}/share`, {
		verifierDID,
		purpose
	});
	return response.data as { shareUrl: string; expiresAt: string };
}

/**
 * Get verification history for a presentation
 */
export async function getPresentationVerificationHistory(
	presentationId: string
): Promise<Array<{
	id: string;
	verifierDID: string;
	verifiedAt: string;
	result: 'valid' | 'invalid';
	trustScore: number;
	errors: string[];
}>> {
	const response = await apiClient.get(`${API_BASE_URL}/${presentationId}/verifications`);
	return response.data as Array<{
		id: string;
		verifierDID: string;
		verifiedAt: string;
		result: 'valid' | 'invalid';
		trustScore: number;
		errors: string[];
	}>;
}

/**
 * Export presentation as JSON
 */
export async function exportPresentation(presentationId: string): Promise<VerifiablePresentation> {
	const response = await apiClient.get(`${API_BASE_URL}/${presentationId}/export`);
	return response.data as VerifiablePresentation;
}

/**
 * Batch operations for presentations
 */
export async function bulkDeletePresentations(presentationIds: string[]): Promise<{
	successCount: number;
	failureCount: number;
	errors: Array<{ id: string; error: string }>;
}> {
	try {
		const response = await apiClient.post(`${API_BASE_URL}/bulk/delete`, {
			presentationIds
		});
		const data = response.data as {
			successCount?: number;
			failureCount?: number;
			errors?: Array<{ id: string; error: string }>;
		};

		// Ensure we always return the expected structure
		return {
			successCount: data?.successCount || 0,
			failureCount: data?.failureCount || 0,
			errors: Array.isArray(data?.errors) ? data.errors : []
		};
	} catch (error) {
		console.error('Error in bulk delete:', error);

		// Return failure response on error
		return {
			successCount: 0,
			failureCount: presentationIds.length,
			errors: presentationIds.map(id => ({ id, error: 'Network error' }))
		};
	}
}

export async function bulkUpdatePresentationStatus(
	presentationIds: string[],
	status: 'submitted' | 'verified' | 'rejected'
): Promise<{
	successCount: number;
	failureCount: number;
	errors: Array<{ id: string; error: string }>;
}> {
	const response = await apiClient.post(`${API_BASE_URL}/bulk/status`, {
		presentationIds,
		status
	});
	return response.data as {
		successCount: number;
		failureCount: number;
		errors: Array<{ id: string; error: string }>;
	};
}
