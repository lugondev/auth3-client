import apiClient from '@/lib/apiClient';
import type {
  PresentationRequest,
  CreatePresentationRequestDTO,
  PresentationResponse,
  PresentationRequestListResponse,
  PresentationResponseListResponse
} from '../types/presentation-request';

// History types
export interface PresentationRequestHistoryItem extends PresentationRequest {
  latest_response?: {
    id: string;
    holder_did: string;
    status: string;
    submitted_at: string;
    verified_at?: string;
  };
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

export const presentationRequestService = {
  // Presentation Requests
  async createRequest(data: CreatePresentationRequestDTO): Promise<PresentationRequest> {
    const response = await apiClient.post<PresentationRequest>('/api/v1/presentation-requests', data);
    return response.data;
  },

  async getRequests(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    verifierDid?: string;
  }): Promise<PresentationRequestListResponse> {
    const response = await apiClient.get<PresentationRequestListResponse>('/api/v1/presentation-requests', {
      params
    });
    return response.data;
  },

  async getRequestById(id: string): Promise<PresentationRequest> {
    const response = await apiClient.get<PresentationRequest>(`/api/v1/presentation-requests/${id}`);
    return response.data;
  },

  async getRequestByRequestId(requestId: string): Promise<PresentationRequest> {
    const response = await apiClient.get<PresentationRequest>(`/api/v1/presentation-requests/by-request-id/${requestId}`);
    return response.data;
  },

  async getHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    verifier_did?: string;
  }): Promise<PresentationRequestHistoryResponse> {
    const response = await apiClient.get<PresentationRequestHistoryResponse>('/api/v1/presentation-requests/history', {
      params
    });
    return response.data;
  },

  async updateRequest(id: string, data: Partial<CreatePresentationRequestDTO>): Promise<PresentationRequest> {
    const response = await apiClient.put<PresentationRequest>(`/api/v1/presentation-requests/${id}`, data);
    return response.data;
  },

  async deleteRequest(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/presentation-requests/${id}`);
  },

  async revokeRequest(id: string): Promise<PresentationRequest> {
    const response = await apiClient.post<PresentationRequest>(`/api/v1/presentation-requests/${id}/revoke`);
    return response.data;
  },

  async generateQRCode(id: string): Promise<{ qrCodeData: string; shareUrl: string }> {
    const response = await apiClient.post<{ qrCodeData: string; shareUrl: string }>(`/api/v1/presentation-requests/${id}/qr-code`);
    return response.data;
  },

  // Presentation Responses
  async getResponses(requestId: string, params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    holderDid?: string;
  }): Promise<PresentationResponseListResponse> {
    const response = await apiClient.get<PresentationResponseListResponse>(`/api/v1/presentation-requests/${requestId}/responses`, {
      params
    });
    return response.data;
  },

  async getResponseById(requestId: string, responseId: string): Promise<PresentationResponse> {
    const response = await apiClient.get<PresentationResponse>(`/api/v1/presentation-requests/${requestId}/responses/${responseId}`);
    return response.data;
  },

  async submitResponse(requestId: string, data: {
    holder_did: string;
    presentation_id: string;
  }): Promise<PresentationResponse> {
    const response = await apiClient.post<PresentationResponse>(`/api/v1/presentation-requests/${requestId}/responses`, data);
    return response.data;
  },

  async verifyResponse(requestId: string, responseId: string): Promise<PresentationResponse> {
    const response = await apiClient.post<PresentationResponse>(`/api/v1/presentation-requests/${requestId}/responses/${responseId}/verify`);
    return response.data;
  },

  async rejectResponse(requestId: string, responseId: string, reason?: string): Promise<PresentationResponse> {
    const response = await apiClient.post<PresentationResponse>(`/api/v1/presentation-requests/${requestId}/responses/${responseId}/reject`, {
      reason
    });
    return response.data;
  }
};
