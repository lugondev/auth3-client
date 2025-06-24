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
	VerifiablePresentation,
	PresentationFilters,
	EnhancedVerificationResponse,
	EnhancedVerificationRequest,
	PresentationStatistics,
	VerificationHistoryResponse
} from '@/types/presentations';

const API_BASE_URL = '/api/v1/presentations';

/**
 * Create a new verifiable presentation
 */
export async function createPresentation(request: CreatePresentationRequest): Promise<CreatePresentationResponse> {
	try {
		const response = await apiClient.post(`${API_BASE_URL}/create`, request);
		return response.data as CreatePresentationResponse;
	} catch (error) {
		// Re-throw with enhanced error information for better handling in UI
		if (error && typeof error === 'object' && 'response' in error) {
			const axiosError = error as {
				response?: {
					data?: {
						message?: string;
						errors?: string[];
						details?: Record<string, unknown>;
					};
					status?: number;
				}
			};

			// Enhance validation errors for credential UUIDs
			if (axiosError.response?.status === 400 && axiosError.response?.data?.message?.includes('credentials')) {
				const enhancedError = new Error('Invalid credential UUIDs provided. Please ensure all credential IDs are valid UUID format.');
				enhancedError.name = 'ValidationError';
				throw enhancedError;
			}
		}
		throw error;
	}
}

/**
 * Get user's presentations with optional filters
 */
export async function getMyPresentations(filters?: PresentationFilters): Promise<PresentationListResponse> {
	try {
		const params = new URLSearchParams();

		// Use 'page' instead of 'offset' to match handler
		const page = filters?.offset ? Math.floor(filters.offset / (filters.limit || 10)) + 1 : 1;
		params.append('page', page.toString());

		if (filters?.limit) params.append('limit', filters.limit.toString());
		if (filters?.holderDID) params.append('holderDID', filters.holderDID);
		if (filters?.status) params.append('status', filters.status);

		const queryString = params.toString();
		const url = queryString ? `${API_BASE_URL}?${queryString}` : `${API_BASE_URL}`;

		const response = await apiClient.get(url);
		const data = response.data as PresentationListResponse;

		// Ensure we always return the expected structure
		return {
			presentations: Array.isArray(data?.presentations) ? data.presentations : [],
			pagination: data?.pagination || {
				currentPage: 1,
				pageSize: 10,
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
				pageSize: 10,
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
export async function getPresentationById(presentationId: string): Promise<{ presentation: VerifiablePresentation }> {
	const response = await apiClient.get(`${API_BASE_URL}/${presentationId}`);
	return response.data as { presentation: VerifiablePresentation };
}

/**
 * Get presentations by holder DID
 */
export async function getPresentationsByHolder(
	holderDID: string,
	page: number = 1,
	limit: number = 10
): Promise<PresentationListResponse> {
	try {
		const params = new URLSearchParams();
		params.append('page', page.toString());
		params.append('limit', limit.toString());

		const queryString = params.toString();
		const url = `${API_BASE_URL}/holder/${encodeURIComponent(holderDID)}?${queryString}`;

		const response = await apiClient.get(url);
		const data = response.data as PresentationListResponse;

		return {
			presentations: Array.isArray(data?.presentations) ? data.presentations : [],
			pagination: data?.pagination || {
				currentPage: 1,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
				hasPrevious: false,
				hasNext: false
			},
			total: data?.total || 0
		};
	} catch (error) {
		console.error('Error fetching presentations by holder:', error);
		return {
			presentations: [],
			pagination: {
				currentPage: 1,
				pageSize: 10,
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
 * Verify a presentation
 */
export async function verifyPresentation(request: VerifyPresentationRequest): Promise<VerifyPresentationResponse> {
	const response = await apiClient.post(`${API_BASE_URL}/verify`, request);
	return response.data as VerifyPresentationResponse;
}

/**
 * Enhanced verify a presentation with trust scoring
 */
export async function verifyPresentationEnhanced(request: EnhancedVerificationRequest): Promise<EnhancedVerificationResponse> {
	const response = await apiClient.post(`${API_BASE_URL}/verify/enhanced`, request);
	return response.data as EnhancedVerificationResponse;
}

/**
 * Get presentation statistics
 */
export async function getPresentationStatistics(): Promise<PresentationStatistics> {
	const response = await apiClient.get(`${API_BASE_URL}/statistics`);
	return response.data as PresentationStatistics;
}

/**
 * Get verification history for a presentation
 */
export async function getPresentationVerificationHistory(
	presentationId: string,
	page: number = 1,
	limit: number = 10
): Promise<VerificationHistoryResponse> {
	const params = new URLSearchParams();
	params.append('page', page.toString());
	params.append('limit', limit.toString());

	const response = await apiClient.get(
		`${API_BASE_URL}/${encodeURIComponent(presentationId)}/verifications?${params.toString()}`
	);
	return response.data as VerificationHistoryResponse;
}

/**
 * Delete a presentation
 */
export async function deletePresentation(presentationId: string): Promise<void> {
	await apiClient.delete(`${API_BASE_URL}/${presentationId}`);
}
