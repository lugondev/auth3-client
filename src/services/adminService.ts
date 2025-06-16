import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import {
	UserListResponse,
	UserStatusUpdateRequest,
	SystemStatsResponse,
	AdminAuditLogResponse,
	SystemConfigResponse,
	SystemConfigUpdateRequest,
	BulkUserActionRequest,
	BulkUserActionResponse,
	SystemHealthResponse,
} from '@/types';

/**
 * Admin Service for system administration operations
 * Provides functionality for user management, system configuration, and monitoring
 */
class AdminService {
	private baseUrl = '/api/v1/admin';

	/**
	 * Get all users with pagination and filtering
	 */
	async getAllUsers(params?: {
		page?: number;
		limit?: number;
		status?: string;
		role?: string;
		search?: string;
		sort_by?: string;
		sort_order?: 'asc' | 'desc';
	}): Promise<UserListResponse> {
		return await withErrorHandling(async () => {
			const response = await apiClient.get<UserListResponse>(`${this.baseUrl}/users`, { params });
			return response.data;
		})();
	}

	/**
	 * Update user status (activate/deactivate/suspend)
	 */
	updateUserStatus = withErrorHandling(async (userId: string, data: UserStatusUpdateRequest): Promise<void> => {
		await apiClient.patch(`${this.baseUrl}/users/${userId}/status`, data);
	});

	/**
	 * Delete user account
	 */
	deleteUser = withErrorHandling(async (userId: string): Promise<void> => {
		await apiClient.delete(`${this.baseUrl}/users/${userId}`);
	});

	/**
	 * Perform bulk actions on multiple users
	 */
	bulkUserAction = withErrorHandling(async (data: BulkUserActionRequest): Promise<BulkUserActionResponse> => {
		const response = await apiClient.post<BulkUserActionResponse>(`${this.baseUrl}/users/bulk-action`, data);
		return response.data;
	});

	/**
	 * Get system statistics
	 */
	getSystemStats = withErrorHandling(async (): Promise<SystemStatsResponse> => {
		const response = await apiClient.get<SystemStatsResponse>(`${this.baseUrl}/stats`);
		return response.data;
	});

	/**
	 * Get audit logs with pagination and filtering
	 */
	getAuditLogs = withErrorHandling(async (params?: {
		page?: number;
		limit?: number;
		user_id?: string;
		action?: string;
		resource?: string;
		start_date?: string;
		end_date?: string;
	}): Promise<AdminAuditLogResponse> => {
		const response = await apiClient.get<AdminAuditLogResponse>(`${this.baseUrl}/audit-logs`, { params });
		return response.data;
	});

	/**
	 * Get system configuration
	 */
	getSystemConfig = withErrorHandling(async (): Promise<SystemConfigResponse> => {
		const response = await apiClient.get<SystemConfigResponse>(`${this.baseUrl}/config`);
		return response.data;
	});

	/**
	 * Update system configuration
	 */
	updateSystemConfig = withErrorHandling(async (data: SystemConfigUpdateRequest): Promise<SystemConfigResponse> => {
		const response = await apiClient.put<SystemConfigResponse>(`${this.baseUrl}/config`, data);
		return response.data;
	});

	/**
	 * Export users data
	 */
	exportUsers = withErrorHandling(async (format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
		const response = await apiClient.get<Blob>(`${this.baseUrl}/users/export`, {
			params: { format },
			responseType: 'blob',
		});
		return response.data;
	});

	/**
	 * Import users from file
	 */
	importUsers = withErrorHandling(async (file: File): Promise<BulkUserActionResponse> => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await apiClient.post<BulkUserActionResponse>(`${this.baseUrl}/users/import`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	});

	/**
	 * Send system notification to all users
	 */
	sendSystemNotification = withErrorHandling(async (data: {
		title: string;
		message: string;
		type: 'info' | 'warning' | 'error' | 'success';
		target_users?: string[];
	}): Promise<void> => {
		await apiClient.post(`${this.baseUrl}/notifications/send`, data);
	});

	/**
	 * Clear system cache
	 */
	clearCache = withErrorHandling(async (cacheType?: string): Promise<void> => {
		await apiClient.post(`${this.baseUrl}/cache/clear`, { cache_type: cacheType });
	});

	/**
	 * Get system health status
	 */
	getSystemHealth = withErrorHandling(async (): Promise<SystemHealthResponse> => {
		const response = await apiClient.get<SystemHealthResponse>(`${this.baseUrl}/health`);
		return response.data;
	});
}

export const adminService = new AdminService();
export default adminService;
