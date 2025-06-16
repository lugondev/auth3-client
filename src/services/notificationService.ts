import { withErrorHandling } from './errorHandlingService';
import apiClient from '@/lib/apiClient';
import {
	Notification,
	NotificationListResponse,
	NotificationPreferences,
	CreateNotificationRequest,
	NotificationTemplate,
	NotificationTemplateListResponse,
	CreateNotificationTemplateRequest,
	UpdateNotificationTemplateRequest,
	NotificationStatsResponse,
	BulkNotificationRequest,
	BulkNotificationResponse,
} from '@/types';

/**
 * Get user notifications with pagination and filtering
 */
const baseUrl = '/api/v1/notifications';

export const getNotifications = withErrorHandling(async (params?: {
	page?: number;
	limit?: number;
	type?: string;
	status?: 'unread' | 'read' | 'archived';
	start_date?: string;
	end_date?: string;
}): Promise<NotificationListResponse> => {
	const response = await apiClient.get<NotificationListResponse>(baseUrl, { params });
	return response.data;
});

/**
 * Get a specific notification by ID
 */
export const getNotification = withErrorHandling(async (notificationId: string): Promise<Notification> => {
	const response = await apiClient.get<Notification>(`${baseUrl}/${notificationId}`);
	return response.data;
});

/**
 * Mark notification as read
 */
export const markAsRead = withErrorHandling(async (notificationId: string): Promise<void> => {
	await apiClient.patch(`${baseUrl}/${notificationId}/read`);
});

/**
 * Mark notification as unread
 */
export const markAsUnread = withErrorHandling(async (notificationId: string): Promise<void> => {
	await apiClient.patch(`${baseUrl}/${notificationId}/unread`);
});

/**
 * Archive notification
 */
export const archiveNotification = withErrorHandling(async (notificationId: string): Promise<void> => {
	await apiClient.patch(`${baseUrl}/${notificationId}/archive`);
});

/**
 * Delete notification
 */
export const deleteNotification = withErrorHandling(async (notificationId: string): Promise<void> => {
	await apiClient.delete(`${baseUrl}/${notificationId}`);
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = withErrorHandling(async (): Promise<void> => {
	await apiClient.patch(`${baseUrl}/mark-all-read`);
});

/**
 * Get unread notification count
 */
export const getUnreadCount = withErrorHandling(async (): Promise<{ count: number }> => {
	const response = await apiClient.get<{ count: number }>(`${baseUrl}/unread-count`);
	return response.data;
});

/**
 * Get notification preferences
 */
export const getPreferences = withErrorHandling(async (): Promise<NotificationPreferences> => {
	const response = await apiClient.get<NotificationPreferences>(`${baseUrl}/preferences`);
	return response.data;
});

/**
 * Update notification preferences
 */
export const updatePreferences = withErrorHandling(async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
	const response = await apiClient.put<NotificationPreferences>(`${baseUrl}/preferences`, preferences);
	return response.data;
});

/**
 * Send a notification to specific users (admin only)
 */
export const sendNotification = withErrorHandling(async (data: CreateNotificationRequest): Promise<Notification> => {
	const response = await apiClient.post<Notification>(`${baseUrl}/send`, data);
	return response.data;
});

/**
 * Send bulk notifications (admin only)
 */
export const sendBulkNotifications = withErrorHandling(async (data: BulkNotificationRequest): Promise<BulkNotificationResponse> => {
	const response = await apiClient.post<BulkNotificationResponse>(`${baseUrl}/send-bulk`, data);
	return response.data;
});

/**
 * Get notification statistics (admin only)
 */
export const getStats = withErrorHandling(async (params?: {
	start_date?: string;
	end_date?: string;
	type?: string;
}): Promise<NotificationStatsResponse> => {
	const response = await apiClient.get<NotificationStatsResponse>(`${baseUrl}/stats`, { params });
	return response.data;
});

// Notification Templates (Admin)

/**
 * Get notification templates
 */
export const getTemplates = withErrorHandling(async (params?: {
	page?: number;
	limit?: number;
	type?: string;
	status?: 'active' | 'inactive';
}): Promise<NotificationTemplateListResponse> => {
	const response = await apiClient.get<NotificationTemplateListResponse>(`${baseUrl}/templates`, { params });
	return response.data;
});

/**
 * Get a specific notification template
 */
export const getTemplate = withErrorHandling(async (templateId: string): Promise<NotificationTemplate> => {
	const response = await apiClient.get<NotificationTemplate>(`${baseUrl}/templates/${templateId}`);
	return response.data;
});

/**
 * Create notification template
 */
export const createTemplate = withErrorHandling(async (data: CreateNotificationTemplateRequest): Promise<NotificationTemplate> => {
	const response = await apiClient.post<NotificationTemplate>(`${baseUrl}/templates`, data);
	return response.data;
});

/**
 * Update notification template
 */
export const updateTemplate = withErrorHandling(async (templateId: string, data: UpdateNotificationTemplateRequest): Promise<NotificationTemplate> => {
	const response = await apiClient.put<NotificationTemplate>(`${baseUrl}/templates/${templateId}`, data);
	return response.data;
});

/**
 * Delete notification template
 */
export const deleteTemplate = withErrorHandling(async (templateId: string): Promise<void> => {
	await apiClient.delete(`${baseUrl}/templates/${templateId}`);
});

/**
 * Test notification template
 */
export const testTemplate = withErrorHandling(async (templateId: string, testData?: Record<string, string>): Promise<{ success: boolean; preview: string }> => {
	const response = await apiClient.post<{ success: boolean; preview: string }>(
		`${baseUrl}/templates/${templateId}/test`,
		{ test_data: testData }
	);
	return response.data;
});

// Real-time notifications (WebSocket/SSE)

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (onNotification: (notification: Notification) => void): () => void => {
	// This would typically use WebSocket or Server-Sent Events
	// Implementation depends on the backend real-time solution
	const eventSource = new EventSource(`${baseUrl}/stream`);

	eventSource.onmessage = (event) => {
		try {
			const notification = JSON.parse(event.data);
			onNotification(notification);
		} catch (error) {
			console.error('Error parsing notification:', error);
		}
	};

	eventSource.onerror = (error) => {
		console.error('Notification stream error:', error);
	};

	// Return cleanup function
	return () => {
		eventSource.close();
	};
};

// Export all notification service functions