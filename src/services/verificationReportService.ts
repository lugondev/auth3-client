import apiClient from '@/lib/apiClient';
import {
	VerificationHistoryListResponse,
	VerificationHistoryResponse,
	VerificationDailyStatsResponse,
	VerificationStatisticsResponse,
	TopVerifiersResponse
} from '@/types/verification';
import {
	VerificationHistoryQuery,
	VerificationDailyStatsQuery,
	ExportVerificationHistoryQuery,
	VerificationHistoryByResourceQuery,
	VerificationStatisticsQuery,
	TopVerifiersQuery,
	VerificationHistoryByVerifierQuery
} from '@/types/verificationParams';

// Get all verification history records
export async function getVerificationHistory(params?: VerificationHistoryQuery) {
	const response = await apiClient.get<VerificationHistoryListResponse>('/api/v1/verification-history', { params });
	return response.data;
}

// Get daily verification statistics
export async function getVerificationDailyStats(params: VerificationDailyStatsQuery) {
	const response = await apiClient.get<VerificationDailyStatsResponse[]>('/api/v1/verification-history/daily-stats', { params });
	return response.data;
}

// Export verification history (returns a file blob)
export async function exportVerificationHistory(params: ExportVerificationHistoryQuery) {
	const response = await apiClient.get<Blob>('/api/v1/verification-history/export', { params, responseType: 'blob' });
	return response.data;
}

// Get verification history by resource
export async function getVerificationHistoryByResource(resourceId: string, params: VerificationHistoryByResourceQuery) {
	const response = await apiClient.get<VerificationHistoryListResponse>(`/api/v1/verification-history/resource/${resourceId}`, {
		params
	});
	return response.data;
}

// Get verification statistics
export async function getVerificationStatistics(params?: VerificationStatisticsQuery) {
	const response = await apiClient.get<VerificationStatisticsResponse>('/api/v1/verification-history/statistics', { params });
	return response.data;
}

// Get top verifiers
export async function getTopVerifiers(params?: TopVerifiersQuery) {
	const response = await apiClient.get<TopVerifiersResponse>('/api/v1/verification-history/top-verifiers', { params });
	return response.data;
}

// Get verification history by verifier DID
export async function getVerificationHistoryByVerifier(verifierDID: string, params?: VerificationHistoryByVerifierQuery) {
	const response = await apiClient.get<VerificationHistoryListResponse>(`/api/v1/verification-history/verifier/${verifierDID}`, { params });
	return response.data;
}

// Get verification history by ID
export async function getVerificationHistoryById(verificationId: string) {
	const response = await apiClient.get<VerificationHistoryResponse>(`/api/v1/verification-history/${verificationId}`);
	return response.data;
}
