/**
 * Tenant Presentation Service - API interactions for tenant-specific verifiable presentations
 */

import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import {
  CreatePresentationInput,
  CreatePresentationOutput,
  VerifyPresentationInput,
  VerifyPresentationOutput,
} from '@/types/credentials';

// Tenant-specific presentation types
export interface TenantPresentationListQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
  holder?: string;
  verifier?: string;
}

export interface TenantPresentationListResponse {
  presentations: TenantPresentation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantPresentation {
  id: string;
  type: string[];
  holder: string;
  verifier?: string;
  status: 'created' | 'submitted' | 'verified' | 'rejected';
  verifiableCredential: unknown[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a new verifiable presentation within tenant context
 * @param tenantId - The tenant ID
 * @param input - Presentation creation parameters
 * @returns Promise resolving to the created presentation
 */
export const createTenantPresentation = withErrorHandling(
  async (tenantId: string, input: CreatePresentationInput): Promise<CreatePresentationOutput> => {
    const response = await apiClient.post<CreatePresentationOutput>(
      `/api/v1/tenants/${tenantId}/presentations`,
      input
    );
    return response.data;
  }
);

/**
 * Verifies a verifiable presentation within tenant context
 * @param tenantId - The tenant ID
 * @param input - Presentation verification parameters
 * @returns Promise resolving to verification result
 */
export const verifyTenantPresentation = withErrorHandling(
  async (tenantId: string, input: VerifyPresentationInput): Promise<VerifyPresentationOutput> => {
    const response = await apiClient.post<VerifyPresentationOutput>(
      `/api/v1/tenants/${tenantId}/presentations/verify`,
      input
    );
    return response.data;
  }
);

/**
 * Lists presentations within tenant context with optional filtering and pagination
 * @param tenantId - The tenant ID
 * @param query - Query parameters for filtering and pagination
 * @returns Promise resolving to paginated presentation list
 */
export const listTenantPresentations = withErrorHandling(
  async (tenantId: string, query?: TenantPresentationListQuery): Promise<TenantPresentationListResponse> => {
    const params = new URLSearchParams();

    if (query) {
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.status) params.append('status', query.status);
      if (query.type) params.append('type', query.type);
      if (query.search) params.append('search', query.search);
      if (query.holder) params.append('holder', query.holder);
      if (query.verifier) params.append('verifier', query.verifier);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/api/v1/tenants/${tenantId}/presentations?${queryString}`
      : `/api/v1/tenants/${tenantId}/presentations`;

    const response = await apiClient.get<TenantPresentationListResponse>(url);
    return response.data;
  }
);

/**
 * Gets a presentation by its ID within tenant context
 * @param tenantId - The tenant ID
 * @param presentationId - The presentation ID
 * @returns Promise resolving to the presentation
 */
export const getTenantPresentation = withErrorHandling(
  async (tenantId: string, presentationId: string): Promise<TenantPresentation> => {
    const response = await apiClient.get<TenantPresentation>(
      `/api/v1/tenants/${tenantId}/presentations/${presentationId}`
    );
    return response.data;
  }
);

/**
 * Deletes a presentation by its ID within tenant context
 * @param tenantId - The tenant ID
 * @param presentationId - The presentation ID
 * @returns Promise resolving when deletion is complete
 */
export const deleteTenantPresentation = withErrorHandling(
  async (tenantId: string, presentationId: string): Promise<void> => {
    await apiClient.delete(
      `/api/v1/tenants/${tenantId}/presentations/${presentationId}`
    );
  }
);
