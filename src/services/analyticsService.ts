import apiClient from '@/lib/apiClient';

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
 * Analytics Service
 * Handles all analytics-related API calls
 */
export class AnalyticsService {
	/**
	 * Get personal dashboard analytics for the current user
	 */
	static async getPersonalDashboardAnalytics(
		query?: AnalyticsQuery
	): Promise<PersonalDashboardAnalytics> {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}

		const response = await apiClient.get<PersonalDashboardAnalytics>(
			`/api/v1/analytics/personal?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Get system dashboard analytics (admin only)
	 */
	static async getSystemDashboardAnalytics(
		query?: AnalyticsQuery
	): Promise<SystemDashboardAnalytics> {
		const params = new URLSearchParams();

		if (query?.time_range?.start_date) {
			params.append('start_date', query.time_range.start_date);
		}
		if (query?.time_range?.end_date) {
			params.append('end_date', query.time_range.end_date);
		}

		const response = await apiClient.get<SystemDashboardAnalytics>(
			`/api/v1/analytics/admin/system?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Get user growth data
	 */
	static async getUserGrowthData(
		query?: AnalyticsQuery
	): Promise<UserGrowthItem[]> {
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

		const response = await apiClient.get<UserGrowthItem[]>(
			`/api/v1/analytics/admin/user-growth?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Get login activity data
	 */
	static async getLoginActivityData(
		query?: AnalyticsQuery
	): Promise<LoginActivityItem[]> {
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

		const response = await apiClient.get<LoginActivityItem[]>(
			`/api/v1/analytics/admin/login-activity?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Get top devices data
	 */
	static async getTopDevices(
		query?: AnalyticsQuery
	): Promise<DeviceStatsItem[]> {
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

		const response = await apiClient.get<DeviceStatsItem[]>(
			`/api/v1/analytics/admin/top-devices?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Get top locations data
	 */
	static async getTopLocations(
		query?: AnalyticsQuery
	): Promise<LocationStatsItem[]> {
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

		const response = await apiClient.get<LocationStatsItem[]>(
			`/api/v1/analytics/admin/top-locations?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Get security events data
	 */
	static async getSecurityEvents(
		query?: AnalyticsQuery
	): Promise<SecurityEventItem[]> {
		const params = new URLSearchParams();

		if (query?.user_id) {
			params.append('user_id', query.user_id);
		}
		if (query?.limit) {
			params.append('limit', query.limit.toString());
		}
		if (query?.offset) {
			params.append('offset', query.offset.toString());
		}

		const response = await apiClient.get<SecurityEventItem[]>(
			`/api/v1/analytics/admin/security-events?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Get tenant statistics data
	 */
	static async getTenantStats(
		query?: AnalyticsQuery
	): Promise<TenantStatsItem[]> {
		const params = new URLSearchParams();

		if (query?.limit) {
			params.append('limit', query.limit.toString());
		}
		if (query?.offset) {
			params.append('offset', query.offset.toString());
		}

		const response = await apiClient.get<TenantStatsItem[]>(
			`/api/v1/analytics/admin/tenant-stats?${params.toString()}`
		);
		return response.data;
	}
}

export default AnalyticsService;