import apiClient from '@/lib/apiClient';

// API response types
interface ApiCredentialRequirement {
  type: string;
  essential: boolean;
  purpose: string;
  issuer?: string;
  schema?: string;
  constraints?: Record<string, unknown>;
}

interface ApiPresentationResponse {
  id: string;
  holder_did: string;
  presentation_id: string;
  status: string;
  submitted_at: string;
  verified_at?: string;
  verification_result?: Record<string, unknown>;
}

interface ApiLatestResponse {
  id: string;
  holder_did: string;
  status: string;
  submitted_at: string;
  verified_at?: string;
}

interface ApiPresentationRequest {
  id: string;
  verifier_did: string;
  verifier_name: string;
  title: string;
  description: string;
  purpose: string;
  required_credentials: ApiCredentialRequirement[];
  status: 'active' | 'expired' | 'completed' | 'closed';
  response_count: number;
  max_responses: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  share_url: string;
  qr_code_data: string;
  latest_response?: ApiLatestResponse | null;
  responses?: ApiPresentationResponse[];
  response_total?: number;
}

interface ApiHistoryResponse {
  requests: ApiPresentationRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: {
    status?: string;
    verifier_did?: string;
  };
}

interface MockHistoryResponse {
  data: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface HistoryFilters {
  search?: string;
  status?: 'active' | 'expired' | 'completed' | 'closed' | 'all';
  verifier_did?: string;
  page?: number;
  limit?: number;
}

export interface PresentationRequestHistoryItem {
  id: string;
  request_id: string;
  verifier_did: string;
  verifier_name: string;
  title: string;
  description: string;
  purpose: string;
  required_credentials: Array<{
    type: string;
    essential: boolean;
    purpose: string;
    issuer?: string;
    schema?: string;
    constraints?: Record<string, unknown>;
  }>;
  status: 'active' | 'expired' | 'completed' | 'closed';
  response_count: number;
  max_responses: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  share_url: string;
  qr_code_data: string;
  latest_response?: {
    id: string;
    holder_did: string;
    status: string;
    submitted_at: string;
    verified_at?: string;
  } | null;
  responses?: Array<{
    id: string;
    holder_did: string;
    presentation_id: string;
    status: string;
    submitted_at: string;
    verified_at?: string;
    verification_result?: Record<string, unknown>;
  }>;
  response_total?: number;
}

export interface PresentationRequestHistoryResponse {
  requests: PresentationRequestHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: {
    status?: string;
    verifier_did?: string;
  };
}

// Legacy interfaces for backward compatibility
export interface HistoryItem {
  id: string;
  type: 'request' | 'response' | 'verification';
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  verifier: string;
  holder?: string;
  details: {
    credentialTypes?: string[];
    responseTime?: string;
    verificationScore?: number;
    requestId?: string;
    presentationId?: string;
    responseCount?: number;
    responseTotal?: number;
    allResponses?: Array<{
      id: string;
      holder_did: string;
      presentation_id: string;
      status: string;
      submitted_at: string;
      verified_at?: string;
      verification_result?: Record<string, unknown>;
    }>;
  };
}

export interface HistoryListResponse {
  data: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

class HistoryService {
  // Get presentation request history in HistoryItem format (main method)
  async getHistory(filters?: HistoryFilters): Promise<HistoryListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.verifier_did) params.append('verifier_did', filters.verifier_did);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);

      // Try to use test endpoint first for development
      let endpoint = `/api/v1/presentation-requests/history?${params.toString()}`;

      // Check if we're in development and should use mock data
      if (typeof window !== 'undefined' && window.location.pathname.includes('/test/')) {
        endpoint = `/api/test/history?${params.toString()}`;
      }

      const response = await apiClient.get<MockHistoryResponse | ApiHistoryResponse>(endpoint);

      // Type guard for mock response
      const isMockResponse = (data: MockHistoryResponse | ApiHistoryResponse): data is MockHistoryResponse => {
        return 'data' in data && Array.isArray((data as MockHistoryResponse).data);
      };

      // Type guard for API response
      const isApiResponse = (data: MockHistoryResponse | ApiHistoryResponse): data is ApiHistoryResponse => {
        return 'requests' in data && Array.isArray((data as ApiHistoryResponse).requests);
      };

      // Handle mock data format (simpler structure)
      if (isMockResponse(response.data)) {
        return {
          data: response.data.data,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
        };
      }

      // Handle real API data format
      if (isApiResponse(response.data)) {
        // Convert to HistoryItem format
        const historyItems: HistoryItem[] = response.data.requests.map((request: ApiPresentationRequest) => ({
          id: request.id,
          type: 'request' as const,
          title: request.title,
          description: request.description || 'No description provided',
          status: this.mapRequestStatusToLegacyStatus(request.status, request.response_count),
          timestamp: request.created_at,
          verifier: request.verifier_name || request.verifier_did,
          holder: request.latest_response?.holder_did,
          details: {
            credentialTypes: request.required_credentials.map((cred: ApiCredentialRequirement) => cred.type),
            requestId: request.id,
            responseTime: request.latest_response?.verified_at && request.latest_response?.submitted_at
              ? this.calculateResponseTime(request.latest_response.submitted_at, request.latest_response.verified_at)
              : undefined,
            verificationScore: this.calculateVerificationScore(request.responses),
            presentationId: request.latest_response?.id,
            // Add response history information
            responseCount: request.response_count,
            responseTotal: request.response_total,
            allResponses: request.responses,
          },
        }));

        return {
          data: historyItems,
          total: response.data.pagination.total,
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
        };
      }

      // Fallback to empty response
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    } catch (error) {
      console.error('Failed to fetch history:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  }

  // Get raw presentation request history data (if needed)
  async getRawHistory(filters?: HistoryFilters): Promise<PresentationRequestHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.verifier_did) params.append('verifier_did', filters.verifier_did);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<PresentationRequestHistoryResponse>(
        `/api/v1/presentation-requests/history?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch raw history:', error);
      // Return empty response on error
      return {
        requests: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
        filters: {
          status: filters?.status || '',
          verifier_did: filters?.verifier_did || '',
        },
      };
    }
  }

  // Backward compatibility aliases
  async getPresentationRequestHistory(filters?: HistoryFilters): Promise<HistoryListResponse> {
    return this.getHistory(filters);
  }

  async getHistoryAsLegacyFormat(filters?: HistoryFilters): Promise<HistoryListResponse> {
    return this.getHistory(filters);
  }

  // Helper methods
  private mapRequestStatusToLegacyStatus(
    status: 'active' | 'expired' | 'completed' | 'closed',
    responseCount: number
  ): 'completed' | 'pending' | 'failed' {
    // Check actual backend status first
    if (status === 'completed') return 'completed';
    if (status === 'active') return 'pending';
    if (status === 'expired') return 'failed';
    if (status === 'closed') return 'failed';

    // Fallback to response count logic for backward compatibility
    if (responseCount > 0) return 'completed';
    return 'pending';
  }

  private mapRequestStatusToHistoryStatus(
    status: 'active' | 'expired' | 'completed' | 'closed',
    responseCount: number
  ): 'completed' | 'pending' | 'failed' {
    return this.mapRequestStatusToLegacyStatus(status, responseCount);
  }

  private mapResponseStatusToHistoryStatus(
    status: 'submitted' | 'verified' | 'rejected'
  ): 'completed' | 'pending' | 'failed' {
    switch (status) {
      case 'verified':
        return 'completed';
      case 'submitted':
        return 'pending';
      case 'rejected':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private calculateResponseTime(submittedAt: string, verifiedAt: string): string {
    const submitted = new Date(submittedAt);
    const verified = new Date(verifiedAt);
    const diffMs = verified.getTime() - submitted.getTime();
    const diffSeconds = Math.round(diffMs / 1000);

    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    } else if (diffSeconds < 3600) {
      return `${Math.round(diffSeconds / 60)}m`;
    } else {
      return `${Math.round(diffSeconds / 3600)}h`;
    }
  }

  private calculateVerificationScore(responses?: Array<{
    verification_result?: Record<string, unknown>;
    status: string;
  }>): number | undefined {
    if (!responses || responses.length === 0) {
      return undefined;
    }

    // Calculate average verification score based on responses
    const scoredResponses = responses.filter(resp =>
      resp.verification_result &&
      typeof resp.verification_result.score === 'number'
    );

    if (scoredResponses.length === 0) {
      // If no scores available, calculate based on status
      const successfulResponses = responses.filter(resp => resp.status === 'verified').length;
      return Math.round((successfulResponses / responses.length) * 100);
    }

    const totalScore = scoredResponses.reduce((sum, resp) => {
      const score = resp.verification_result?.score;
      return sum + (typeof score === 'number' ? score : 0);
    }, 0);

    return Math.round(totalScore / scoredResponses.length);
  }
}

export const historyService = new HistoryService();
