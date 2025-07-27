import apiClient from '../lib/apiClient';
import { withErrorHandling } from './errorHandlingService';

// Tenant DID Types
export interface TenantDIDDocument {
	id: string;
	method: string;
	document: {
		'@context'?: string[];
		id: string;
		verificationMethod?: Array<{
			id: string;
			type: string;
			controller: string;
			publicKeyMultibase?: string;
			publicKeyJwk?: Record<string, unknown>;
		}>;
		authentication?: string[];
		assertionMethod?: string[];
		keyAgreement?: string[];
		capabilityInvocation?: string[];
		capabilityDelegation?: string[];
		service?: Array<{
			id: string;
			type: string;
			serviceEndpoint: string;
		}>;
		[key: string]: unknown;
	};
	privateKey?: string;
	status: 'active' | 'revoked' | 'deactivated';
	capabilities?: string[];
	tenant_capabilities?: Record<string, boolean>;
	tenant_id: string;
	created_at: string;
	updated_at: string;
}

export interface CreateTenantDIDRequest {
	tenant_id: string;
	method: string;
	key_type?: string;
	capabilities?: string[];
	metadata?: Record<string, unknown>;
}

export interface CreateTenantDIDResponse {
	success: boolean;
	data: TenantDIDDocument;
	message?: string;
}

export interface ListTenantDIDsRequest {
	tenantId: string;
	page?: number;
	pageSize?: number;
	method?: string;
	status?: string;
}

export interface ListTenantDIDsResponse {
	dids: TenantDIDDocument[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	}
}

export interface TenantDIDStatsResponse {
	total: number;
	active: number;
	deactivated: number;
	revoked: number;
	byMethod: Record<string, number>;
	recentActivity: Array<{
		action: string;
		didId: string;
		timestamp: string;
	}>;
}

export interface UpdateTenantDIDCapabilitiesRequest {
	tenantId: string;
	didId: string;
	capabilities: string[];
}

export interface TenantDIDPermissionsResponse {
	canCreate: boolean;
	canRead: boolean;
	canUpdate: boolean;
	canDelete: boolean;
	canRevoke: boolean;
	permissions: string[];
}

// Tenant DID Service Functions

/**
 * Get all DIDs for a tenant
 */
export const getTenantDIDs = withErrorHandling(
	async (request: ListTenantDIDsRequest): Promise<ListTenantDIDsResponse> => {
		const { tenantId, ...params } = request;
		const response = await apiClient.get(`/api/v1/tenants/${tenantId}/dids`, {
			params,
		});
		return response.data as ListTenantDIDsResponse;
	}
);

/**
 * Create a new DID for a tenant
 */
export const createTenantDID = withErrorHandling(
	async (request: CreateTenantDIDRequest): Promise<CreateTenantDIDResponse> => {
		const { tenant_id, key_type, ...rest } = request;

		// Transform the request to match backend expectations
		const backendRequest = {
			tenant_id,
			key_type,
			ownership_type: 'FULL', // Default ownership type
			metadata: {},
			service_endpoints: [],
			...rest
		};

		const response = await apiClient.post(`/api/v1/tenants/${tenant_id}/dids`, backendRequest);
		return response.data as CreateTenantDIDResponse;
	}
);

/**
 * Get a specific tenant DID
 */
export const getTenantDID = withErrorHandling(
	async (tenantId: string, didId: string): Promise<{ success: boolean; data: TenantDIDDocument }> => {
		const response = await apiClient.get(`/api/v1/tenants/${tenantId}/dids/${didId}`);
		return response.data as { success: boolean; data: TenantDIDDocument };
	}
);

/**
 * Get tenant DID by method
 */
export const getTenantDIDByMethod = withErrorHandling(
	async (tenantId: string, method: string): Promise<{ success: boolean; data: TenantDIDDocument }> => {
		const response = await apiClient.get(`/api/v1/tenants/${tenantId}/dids/method/${method}`);
		return response.data as { success: boolean; data: TenantDIDDocument };
	}
);

/**
 * Update tenant DID capabilities
 */
export const updateTenantDIDCapabilities = withErrorHandling(
	async (request: UpdateTenantDIDCapabilitiesRequest): Promise<{ success: boolean; data: TenantDIDDocument }> => {
		const { tenantId, didId, ...data } = request;
		const response = await apiClient.put(`/api/v1/tenants/${tenantId}/dids/${didId}/capabilities`, data);
		return response.data as { success: boolean; data: TenantDIDDocument };
	}
);

/**
 * Deactivate a tenant DID
 */
export const deactivateTenantDID = withErrorHandling(
	async (tenantId: string, didId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
		const response = await apiClient.post(`/api/v1/tenants/${tenantId}/dids/${didId}/deactivate`, {
			reason: reason || 'Deactivated by user',
		});
		return response.data as { success: boolean; message: string };
	}
);

/**
 * Revoke a tenant DID
 */
export const revokeTenantDID = withErrorHandling(
	async (tenantId: string, didId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
		const response = await apiClient.post(`/api/v1/tenants/${tenantId}/dids/${didId}/revoke`, {
			reason: reason || 'Revoked by user',
		});
		return response.data as { success: boolean; message: string };
	}
);

/**
 * Reactivate a tenant DID
 */
export const reactivateTenantDID = withErrorHandling(
	async (tenantId: string, didId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
		const response = await apiClient.post(`/api/v1/tenants/${tenantId}/dids/${didId}/reactivate`, {
			reason: reason || 'Reactivated by user',
		});
		return response.data as { success: boolean; message: string };
	}
);

/**
 * Get tenant DID statistics
 */
export const getTenantDIDStats = withErrorHandling(
	async (tenantId: string): Promise<TenantDIDStatsResponse> => {
		const response = await apiClient.get(`/api/v1/tenants/${tenantId}/dids/stats`);
		return response.data as TenantDIDStatsResponse;
	}
);

/**
 * Check tenant DID permissions
 */
export const checkTenantDIDPermissions = withErrorHandling(
	async (tenantId: string): Promise<TenantDIDPermissionsResponse> => {
		const response = await apiClient.get(`/api/v1/tenants/${tenantId}/dids/permissions`);
		return response.data as TenantDIDPermissionsResponse;
	}
);

/**
 * Resolve a public DID
 */
export const resolvePublicTenantDID = withErrorHandling(
	async (didIdentifier: string): Promise<{ success: boolean; data: TenantDIDDocument }> => {
		const response = await apiClient.get(`/api/v1/public/tenant-dids/resolve/${didIdentifier}`);
		return response.data as { success: boolean; data: TenantDIDDocument };
	}
);

/**
 * Verify a DID signature (public endpoint)
 */
export const verifyPublicTenantDID = withErrorHandling(
	async (verificationData: { signature: string; message: string; didDocument: Record<string, unknown> }): Promise<{ success: boolean; data: { isValid: boolean; details: string } }> => {
		const response = await apiClient.post('/api/v1/public/tenant-dids/verify', verificationData);
		return response.data as { success: boolean; data: { isValid: boolean; details: string } };
	}
);

// Admin functions (when user has admin role)

export interface AdminTenantDIDsResponse {
	success: boolean;
	data: {
		dids: TenantDIDDocument[];
		pagination: {
			page: number;
			pageSize: number;
			total: number;
			totalPages: number;
		};
	};
	message?: string;
}

export interface AdminAnalyticsResponse {
	success: boolean;
	data: {
		totalDIDs: number;
		activeByTenant: Record<string, number>;
		methodDistribution: Record<string, number>;
		statusDistribution: Record<string, number>;
	};
	message?: string;
}

export interface AdminBulkOperationResponse {
	success: boolean;
	data: {
		processed: number;
		successful: number;
		failed: number;
		errors: string[];
	};
	message?: string;
}

/**
 * Get all tenant DIDs across all tenants (admin only)
 */
export const getAllTenantDIDs = withErrorHandling(
	async (params?: { page?: number; pageSize?: number }): Promise<AdminTenantDIDsResponse> => {
		const response = await apiClient.get('/api/v1/admin/tenant-dids', { params });
		return response.data as AdminTenantDIDsResponse;
	}
);

/**
 * Get tenant DID analytics (admin only)
 */
export const getTenantDIDAnalytics = withErrorHandling(
	async (): Promise<AdminAnalyticsResponse> => {
		const response = await apiClient.get('/api/v1/admin/tenant-dids/analytics');
		return response.data as AdminAnalyticsResponse;
	}
);

/**
 * Bulk deactivate tenant DIDs (admin only)
 */
export const bulkDeactivateTenantDIDs = withErrorHandling(
	async (didIds: string[], reason?: string): Promise<AdminBulkOperationResponse> => {
		const response = await apiClient.post('/api/v1/admin/tenant-dids/bulk/deactivate', {
			didIds,
			reason: reason || 'Bulk deactivation by admin',
		});
		return response.data as AdminBulkOperationResponse;
	}
);

/**
 * Bulk revoke tenant DIDs (admin only)
 */
export const bulkRevokeTenantDIDs = withErrorHandling(
	async (didIds: string[], reason?: string): Promise<AdminBulkOperationResponse> => {
		const response = await apiClient.post('/api/v1/admin/tenant-dids/bulk/revoke', {
			didIds,
			reason: reason || 'Bulk revocation by admin',
		});
		return response.data as AdminBulkOperationResponse;
	}
);
