import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import { AnalyticsQuery, SystemDashboardAnalytics } from './analyticsService';

// Enhanced Analytics Types for new modules

// ================== OAUTH2 ANALYTICS ==================
export interface OAuth2FlowAnalytics {
	total_authorizations: number;
	successful_authorizations: number;
	failed_authorizations: number;
	success_rate: number;
	avg_authorization_time: number;
	authorization_by_client: Array<{
		client_id: string;
		client_name: string;
		count: number;
		success_rate: number;
	}>;
	authorization_by_flow_type: Array<{
		flow_type: string;
		count: number;
		percentage: number;
	}>;
	time_series: Array<{
		timestamp: string;
		authorizations: number;
		successes: number;
		failures: number;
	}>;
}

export interface OAuth2ClientAnalytics {
	total_clients: number;
	active_clients: number;
	client_usage: Array<{
		client_id: string;
		client_name: string;
		total_requests: number;
		success_rate: number;
		last_used: string;
		usage_this_month: number;
	}>;
	grant_type_distribution: Array<{
		grant_type: string;
		count: number;
		percentage: number;
	}>;
	response_type_distribution: Array<{
		response_type: string;
		count: number;
		percentage: number;
	}>;
}

export interface OAuth2ErrorAnalytics {
	total_errors: number;
	errors_today: number;
	errors_this_week: number;
	error_rate: number;
	errors_by_type: Array<{
		error_code: string;
		error_description: string;
		count: number;
		percentage: number;
	}>;
	errors_by_client: Array<{
		client_id: string;
		client_name: string;
		error_count: number;
		error_rate: number;
	}>;
	error_trends: Array<{
		timestamp: string;
		error_count: number;
		total_requests: number;
		error_rate: number;
	}>;
}

export interface OAuth2DashboardData {
	overview: {
		total_authorizations: number;
		total_tokens_issued: number;
		total_clients: number;
		success_rate: number;
	};
	recent_activity: {
		authorizations_today: number;
		tokens_today: number;
		errors_today: number;
		new_clients_today: number;
	};
	top_clients: Array<{
		client_id: string;
		client_name: string;
		requests_count: number;
		success_rate: number;
	}>;
	flow_analytics: OAuth2FlowAnalytics;
	error_summary: {
		total_errors: number;
		error_rate: number;
		top_errors: Array<{
			error_code: string;
			count: number;
		}>;
	};
}

// ================== DID ANALYTICS ==================
export interface DIDCreationAnalytics {
	total_dids: number;
	dids_created_today: number;
	dids_created_this_week: number;
	dids_created_this_month: number;
	creation_by_method: Array<{
		method: string;
		count: number;
		percentage: number;
	}>;
	creation_trends: Array<{
		timestamp: string;
		count: number;
	}>;
	success_rate: number;
	avg_creation_time: number;
}

export interface DIDResolutionAnalytics {
	total_resolutions: number;
	resolutions_today: number;
	successful_resolutions: number;
	failed_resolutions: number;
	success_rate: number;
	avg_resolution_time: number;
	resolution_by_method: Array<{
		method: string;
		count: number;
		avg_time: number;
		success_rate: number;
	}>;
	resolution_trends: Array<{
		timestamp: string;
		total: number;
		successful: number;
		failed: number;
	}>;
}

export interface DIDMethodAnalytics {
	supported_methods: Array<{
		method: string;
		total_dids: number;
		active_dids: number;
		success_rate: number;
		avg_operation_time: number;
	}>;
	method_popularity: Array<{
		method: string;
		usage_percentage: number;
		trend: 'increasing' | 'decreasing' | 'stable';
	}>;
	method_performance: Array<{
		method: string;
		avg_creation_time: number;
		avg_resolution_time: number;
		error_rate: number;
	}>;
}

export interface DIDDashboardData {
	overview: {
		total_dids: number;
		active_dids: number;
		total_resolutions: number;
		success_rate: number;
	};
	recent_activity: {
		created_today: number;
		resolved_today: number;
		updated_today: number;
		deactivated_today: number;
	};
	method_distribution: Array<{
		method: string;
		count: number;
		percentage: number;
	}>;
	performance_metrics: {
		avg_creation_time: number;
		avg_resolution_time: number;
		uptime_percentage: number;
		error_rate: number;
	};
}

// ================== TENANT ANALYTICS ==================
export interface TenantUsageMetrics {
	total_tenants: number;
	active_tenants: number;
	tenant_growth_rate: number;
	usage_by_tenant: Array<{
		tenant_id: string;
		tenant_name: string;
		user_count: number;
		api_calls: number;
		storage_used: number;
		last_activity: string;
	}>;
	resource_usage: {
		total_api_calls: number;
		total_storage: number;
		avg_users_per_tenant: number;
		peak_usage_time: string;
	};
}

export interface TenantBillingMetrics {
	total_revenue: number;
	revenue_this_month: number;
	billing_by_plan: Array<{
		plan_name: string;
		tenant_count: number;
		revenue: number;
		percentage: number;
	}>;
	payment_status: Array<{
		status: string;
		count: number;
		amount: number;
	}>;
	revenue_trends: Array<{
		timestamp: string;
		revenue: number;
		tenant_count: number;
	}>;
}

export interface TenantGrowthMetrics {
	new_tenants_today: number;
	new_tenants_this_week: number;
	new_tenants_this_month: number;
	growth_rate: number;
	churn_rate: number;
	retention_rate: number;
	growth_trends: Array<{
		timestamp: string;
		new_tenants: number;
		total_tenants: number;
		active_tenants: number;
	}>;
	cohort_analysis: Array<{
		cohort_month: string;
		initial_tenants: number;
		retained_tenants: number;
		retention_rate: number;
	}>;
}

export interface TenantDashboardData {
	overview: {
		total_tenants: number;
		active_tenants: number;
		growth_rate: number;
		revenue_this_month: number;
	};
	tenant_activity: {
		most_active_tenant: {
			name: string;
			activity_score: number;
		};
		least_active_tenant: {
			name: string;
			activity_score: number;
		};
		avg_activity_score: number;
	};
	resource_summary: {
		total_users: number;
		total_api_calls: number;
		total_storage: number;
		avg_response_time: number;
	};
}

// ================== KMS ANALYTICS ==================
export interface KMSKeyManagementMetrics {
	total_keys: number;
	active_keys: number;
	revoked_keys: number;
	expired_keys: number;
	keys_created_today: number;
	keys_rotated_today: number;
	key_by_algorithm: Array<{
		algorithm: string;
		count: number;
		percentage: number;
	}>;
	key_by_purpose: Array<{
		purpose: string;
		count: number;
		percentage: number;
	}>;
	key_lifecycle_events: Array<{
		timestamp: string;
		event_type: string;
		count: number;
	}>;
}

export interface KMSCryptographicMetrics {
	total_operations: number;
	operations_today: number;
	successful_operations: number;
	failed_operations: number;
	success_rate: number;
	avg_operation_time: number;
	operations_by_type: Array<{
		operation_type: string;
		count: number;
		avg_time: number;
		success_rate: number;
	}>;
	performance_trends: Array<{
		timestamp: string;
		total_ops: number;
		avg_time: number;
		error_rate: number;
	}>;
}

export interface KMSSecurityMetrics {
	security_events: number;
	failed_access_attempts: number;
	unauthorized_key_access: number;
	key_compromises: number;
	security_alerts: Array<{
		timestamp: string;
		event_type: string;
		severity: 'low' | 'medium' | 'high' | 'critical';
		description: string;
		affected_keys: number;
	}>;
	access_patterns: Array<{
		user_id: string;
		access_count: number;
		last_access: string;
		risk_score: number;
	}>;
}

export interface KMSDashboardData {
	overview: {
		total_keys: number;
		active_keys: number;
		total_operations: number;
		security_score: number;
	};
	key_health: {
		healthy_keys: number;
		expiring_soon: number;
		compromised_keys: number;
		rotation_needed: number;
	};
	operation_summary: {
		encrypt_operations: number;
		decrypt_operations: number;
		sign_operations: number;
		verify_operations: number;
	};
	security_status: {
		threat_level: 'low' | 'medium' | 'high' | 'critical';
		recent_alerts: number;
		compliance_score: number;
	};
}

// ================== ENHANCED SYSTEM ANALYTICS ==================
export interface EnhancedSystemAnalytics extends SystemDashboardAnalytics {
	module_health: {
		oauth2: {
			status: 'healthy' | 'warning' | 'critical';
			active_clients: number;
			error_rate: number;
			uptime: number;
		};
		did: {
			status: 'healthy' | 'warning' | 'critical';
			total_dids: number;
			resolution_success_rate: number;
			uptime: number;
		};
		tenant: {
			status: 'healthy' | 'warning' | 'critical';
			active_tenants: number;
			growth_rate: number;
			resource_usage: number;
		};
		kms: {
			status: 'healthy' | 'warning' | 'critical';
			active_keys: number;
			security_score: number;
			uptime: number;
		};
	};
	performance_metrics: {
		avg_response_time: number;
		throughput: number;
		error_rate: number;
		memory_usage: number;
		cpu_usage: number;
		disk_usage: number;
	};
	integration_health: Array<{
		service_name: string;
		status: 'online' | 'offline' | 'degraded';
		response_time: number;
		last_check: string;
	}>;
}

// ================== API METHODS ==================

// OAuth2 Analytics API Methods
export const getOAuth2FlowAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<OAuth2FlowAnalytics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);
		if (query?.interval) params.append('interval', query.interval);

		const queryString = params.toString();
		const url = `/api/v1/analytics/oauth2/flows${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<OAuth2FlowAnalytics>(url);
		return response.data;
	}
);

export const getOAuth2ClientAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<OAuth2ClientAnalytics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);

		const queryString = params.toString();
		const url = `/api/v1/analytics/oauth2/clients${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<OAuth2ClientAnalytics>(url);
		return response.data;
	}
);

export const getOAuth2ErrorAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<OAuth2ErrorAnalytics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);

		const queryString = params.toString();
		const url = `/api/v1/analytics/oauth2/errors${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<OAuth2ErrorAnalytics>(url);
		return response.data;
	}
);

export const getOAuth2DashboardData = withErrorHandling(
	async (): Promise<OAuth2DashboardData> => {
		const response = await apiClient.get<OAuth2DashboardData>('/api/v1/analytics/oauth2/dashboard');
		return response.data;
	}
);

// DID Analytics API Methods
export const getDIDCreationAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<DIDCreationAnalytics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);
		if (query?.interval) params.append('interval', query.interval);

		const queryString = params.toString();
		const url = `/api/v1/analytics/did/creation${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<DIDCreationAnalytics>(url);
		return response.data;
	}
);

export const getDIDResolutionAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<DIDResolutionAnalytics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);
		if (query?.interval) params.append('interval', query.interval);

		const queryString = params.toString();
		const url = `/api/v1/analytics/did/resolution${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<DIDResolutionAnalytics>(url);
		return response.data;
	}
);

export const getDIDMethodAnalytics = withErrorHandling(
	async (): Promise<DIDMethodAnalytics> => {
		const response = await apiClient.get<DIDMethodAnalytics>('/api/v1/analytics/did/methods');
		return response.data;
	}
);

export const getDIDDashboardData = withErrorHandling(
	async (): Promise<DIDDashboardData> => {
		const response = await apiClient.get<DIDDashboardData>('/api/v1/analytics/did/dashboard');
		return response.data;
	}
);

// Tenant Analytics API Methods
export const getTenantUsageMetrics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<TenantUsageMetrics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);

		const queryString = params.toString();
		const url = `/api/v1/analytics/tenant/usage${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<TenantUsageMetrics>(url);
		return response.data;
	}
);

export const getTenantBillingMetrics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<TenantBillingMetrics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);

		const queryString = params.toString();
		const url = `/api/v1/analytics/tenant/billing${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<TenantBillingMetrics>(url);
		return response.data;
	}
);

export const getTenantGrowthMetrics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<TenantGrowthMetrics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);
		if (query?.interval) params.append('interval', query.interval);

		const queryString = params.toString();
		const url = `/api/v1/analytics/tenant/growth${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<TenantGrowthMetrics>(url);
		return response.data;
	}
);

export const getTenantDashboardData = withErrorHandling(
	async (): Promise<TenantDashboardData> => {
		const response = await apiClient.get<TenantDashboardData>('/api/v1/analytics/tenant/dashboard');
		return response.data;
	}
);

// KMS Analytics API Methods
export const getKMSKeyManagementMetrics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<KMSKeyManagementMetrics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);

		const queryString = params.toString();
		const url = `/api/v1/analytics/kms/key-management${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<KMSKeyManagementMetrics>(url);
		return response.data;
	}
);

export const getKMSCryptographicMetrics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<KMSCryptographicMetrics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);
		if (query?.interval) params.append('interval', query.interval);

		const queryString = params.toString();
		const url = `/api/v1/analytics/kms/cryptographic${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<KMSCryptographicMetrics>(url);
		return response.data;
	}
);

export const getKMSSecurityMetrics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<KMSSecurityMetrics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);

		const queryString = params.toString();
		const url = `/api/v1/analytics/kms/security${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<KMSSecurityMetrics>(url);
		return response.data;
	}
);

export const getKMSDashboardData = withErrorHandling(
	async (): Promise<KMSDashboardData> => {
		const response = await apiClient.get<KMSDashboardData>('/api/v1/analytics/kms/dashboard');
		return response.data;
	}
);

// Enhanced System Analytics
export const getEnhancedSystemAnalytics = withErrorHandling(
	async (query?: AnalyticsQuery): Promise<EnhancedSystemAnalytics> => {
		const params = new URLSearchParams();
		if (query?.time_range?.start_date) params.append('start_date', query.time_range.start_date);
		if (query?.time_range?.end_date) params.append('end_date', query.time_range.end_date);

		const queryString = params.toString();
		const url = `/api/v1/analytics/admin/enhanced-system${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<EnhancedSystemAnalytics>(url);
		return response.data;
	}
);

// Enhanced Analytics Service Class
export class EnhancedAnalyticsService {
	// OAuth2 Analytics
	static getOAuth2FlowAnalytics = getOAuth2FlowAnalytics;
	static getOAuth2ClientAnalytics = getOAuth2ClientAnalytics;
	static getOAuth2ErrorAnalytics = getOAuth2ErrorAnalytics;
	static getOAuth2DashboardData = getOAuth2DashboardData;

	// DID Analytics
	static getDIDCreationAnalytics = getDIDCreationAnalytics;
	static getDIDResolutionAnalytics = getDIDResolutionAnalytics;
	static getDIDMethodAnalytics = getDIDMethodAnalytics;
	static getDIDDashboardData = getDIDDashboardData;

	// Tenant Analytics
	static getTenantUsageMetrics = getTenantUsageMetrics;
	static getTenantBillingMetrics = getTenantBillingMetrics;
	static getTenantGrowthMetrics = getTenantGrowthMetrics;
	static getTenantDashboardData = getTenantDashboardData;

	// KMS Analytics
	static getKMSKeyManagementMetrics = getKMSKeyManagementMetrics;
	static getKMSCryptographicMetrics = getKMSCryptographicMetrics;
	static getKMSSecurityMetrics = getKMSSecurityMetrics;
	static getKMSDashboardData = getKMSDashboardData;

	// Enhanced System
	static getEnhancedSystemAnalytics = getEnhancedSystemAnalytics;
}

export default EnhancedAnalyticsService;
