import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';

// Analytics Types
export interface AnalyticsTimeRange {
	start_date?: string; // YYYY-MM-DD format
	end_date?: string;   // YYYY-MM-DD format
}

export interface AnalyticsQuery {
	time_range?: AnalyticsTimeRange;
	user_id?: string;
	limit?: number;
	offset?: number;
	interval?: 'day' | 'week' | 'month';
}

// Personal Dashboard Analytics
export interface PersonalDashboardAnalytics {
	total_logins: number;
	recent_logins: number;
	active_sessions: number;
	security_events: number;
	last_login?: string;
	account_created: string;
	two_factor_enabled: boolean;
	email_verified: boolean;
	phone_verified: boolean;
}

// System Dashboard Analytics
export interface SystemDashboardAnalytics {
	total_users: number;
	active_users: number;
	new_users_today: number;
	total_tenants: number;
	active_tenants: number;
	total_logins: number;
	failed_logins: number;
	security_events: number;
	system_health: 'healthy' | 'warning' | 'critical';
}

// Chart Data Types
export interface UserGrowthItem {
	date: string;
	new_users: number;
	total_users: number;
}

export interface LoginActivityItem {
	date: string;
	successful_logins: number;
	failed_logins: number;
}

export interface DeviceStatsItem {
	device_type: string;
	count: number;
	percentage: number;
}

export interface LocationStatsItem {
	country: string;
	city?: string;
	count: number;
	percentage: number;
}

export interface SecurityEventItem {
	id: string;
	user_id: string;
	user_email: string;
	event_type: string;
	description: string;
	ip_address: string;
	user_agent: string;
	location?: string;
	created_at: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TenantStatsItem {
	tenant_id: string;
	tenant_name: string;
	user_count: number;
	active_users: number;
	total_logins: number;
	created_at: string;
	is_active: boolean;
}

/**
 * Get personal dashboard analytics for the current user
 */
export const getPersonalDashboardAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<PersonalDashboardAnalytics> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/personal${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<PersonalDashboardAnalytics>(url);
		return response.data;
	}
);

/**
 * Get system dashboard analytics (admin only)
 */
export const getSystemDashboardAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<SystemDashboardAnalytics> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/system${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<SystemDashboardAnalytics>(url);
		return response.data;
	}
);

/**
 * Get user growth data (admin only)
 */
export const getUserGrowthData = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<UserGrowthItem[]> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}
		if (query?.interval) {
			params.append('interval', query.interval);
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/user-growth${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<UserGrowthItem[]>(url);
		return response.data;
	}
);

/**
 * Get login activity data (admin only)
 */
export const getLoginActivityData = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<LoginActivityItem[]> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}
		if (query?.interval) {
			params.append('interval', query.interval);
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/login-activity${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<LoginActivityItem[]>(url);
		return response.data;
	}
);

/**
 * Get top devices data (admin only)
 */
export const getTopDevicesData = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<DeviceStatsItem[]> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}
		if (query?.limit) {
			params.append('limit', query.limit.toString());
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/top-devices${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<DeviceStatsItem[]>(url);
		return response.data;
	}
);

/**
 * Get top locations data (admin only)
 */
export const getTopLocationsData = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<LocationStatsItem[]> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}
		if (query?.limit) {
			params.append('limit', query.limit.toString());
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/top-locations${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<LocationStatsItem[]>(url);
		return response.data;
	}
);

/**
 * Get security events data (admin only)
 */
export const getSecurityEventsData = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<SecurityEventItem[]> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}
		if (query?.user_id) {
			params.append('user_id', query.user_id);
		}
		if (query?.limit) {
			params.append('limit', query.limit.toString());
		}
		if (query?.offset) {
			params.append('offset', query.offset.toString());
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/security-events${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<SecurityEventItem[]>(url);
		return response.data;
	}
);

/**
 * Get tenant statistics data (admin only)
 */
export const getTenantStatsData = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<TenantStatsItem[]> => {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}
		if (query?.limit) {
			params.append('limit', query.limit.toString());
		}
		if (query?.offset) {
			params.append('offset', query.offset.toString());
		}

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/tenant-stats${queryString ? `?${queryString}` : ''}`;

		const response = await apiClient.get<TenantStatsItem[]>(url);
		return response.data;
	}
);

/**
 * Analytics Service class that provides all analytics functionality
 */
export class AnalyticsService {
	/**
	 * Get personal dashboard analytics for the current user
	 */
	static getPersonalDashboardAnalytics = getPersonalDashboardAnalytics;

	/**
	 * Get system dashboard analytics (admin only)
	 */
	static getSystemDashboardAnalytics = getSystemDashboardAnalytics;

	/**
	 * Get user growth data (admin only)
	 */
	static getUserGrowthData = getUserGrowthData;

	/**
	 * Get login activity data (admin only)
	 */
	static getLoginActivityData = getLoginActivityData;

	/**
	 * Get top devices data (admin only)
	 */
	static getTopDevicesData = getTopDevicesData;

	/**
	 * Get top locations data (admin only)
	 */
	static getTopLocationsData = getTopLocationsData;

	/**
	 * Get security events data (admin only)
	 */
	static getSecurityEventsData = getSecurityEventsData;

	/**
	 * Get tenant statistics data (admin only)
	 */
	static getTenantStatsData = getTenantStatsData;
}

// Export default instance
export default AnalyticsService;