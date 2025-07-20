import apiClient from '@/lib/apiClient';

export interface AuthAnalyticsTimeRange {
  start_date?: string;
  end_date?: string;
}

export interface AuthAnalyticsQuery extends AuthAnalyticsTimeRange {
  interval?: 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
}

// User Analytics Interfaces
export interface UserAuthStats {
  user_id: string;
  total_logins: number;
  failed_logins: number;
  success_rate: number;
  last_login_at?: string;
  login_streak_days: number;
  average_session_duration_minutes: number;
  most_active_hour: number;
  total_2fa_uses: number;
  devices_used: number;
  locations_used: number;
}

export interface LoginHistoryEntry {
  login_at: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  device_type: string;
  success: boolean;
  failure_reason?: string;
  session_duration_minutes?: number;
  requires_2fa: boolean;
  login_method: string;
}

export interface SecurityActivity {
  event_type: string;
  description: string;
  occurred_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address?: string;
  user_agent?: string;
  action_taken?: string;
  related_session_id?: string;
}

// Admin Analytics Interfaces
export interface SystemAuthStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  total_logins_today: number;
  total_logins_week: number;
  failed_logins_today: number;
  failed_logins_week: number;
  success_rate_today: number;
  success_rate_week: number;
  users_with_2fa_enabled: number;
  users_verified_email: number;
  users_verified_phone: number;
  average_session_duration_minutes: number;
  peak_login_hour: number;
  unique_devices_today: number;
  unique_locations_today: number;
}

export interface UserAnalyticsEntry {
  user_id: string;
  email: string;
  full_name: string;
  total_logins: number;
  failed_logins: number;
  success_rate: number;
  last_login_at?: string;
  account_created_at: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_2fa_enabled: boolean;
  login_streak_days: number;
  devices_used: number;
  locations_used: number;
  security_events_count: number;
  is_active: boolean;
}

export interface FailureAnalyticsEntry {
  error_type: string;
  count: number;
  percentage: number;
  first_occurrence: string;
  last_occurrence: string;
  affected_users: number;
  most_common_user_agent?: string;
  most_common_ip?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AuthAnalyticsChartData {
  date: string;
  total_logins: number;
  successful_logins: number;
  failed_logins: number;
  unique_users: number;
  new_registrations: number;
}

/**
 * Auth Analytics Service
 * Handles all authentication-related analytics data retrieval
 */
class AuthAnalyticsService {
  /**
   * Get user's personal authentication statistics
   */
  async getUserAuthStats(query?: AuthAnalyticsQuery): Promise<UserAuthStats> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval);

    const response = await apiClient.get<UserAuthStats>(
      `/api/v1/auth/analytics/user/stats?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get user's login history
   */
  async getUserLoginHistory(query?: AuthAnalyticsQuery): Promise<LoginHistoryEntry[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await apiClient.get<LoginHistoryEntry[]>(
      `/api/v1/auth/analytics/user/login-history?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get user's security activity
   */
  async getUserSecurityActivity(query?: AuthAnalyticsQuery): Promise<SecurityActivity[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await apiClient.get<SecurityActivity[]>(
      `/api/v1/auth/analytics/user/security-activity?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get system authentication statistics (Admin only)
   */
  async getSystemAuthStats(query?: AuthAnalyticsQuery): Promise<SystemAuthStats> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval);

    const response = await apiClient.get<SystemAuthStats>(
      `/api/v1/auth/analytics/admin/system-stats?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get analytics for all users (Admin only)
   */
  async getUserAnalytics(query?: AuthAnalyticsQuery): Promise<UserAnalyticsEntry[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await apiClient.get<UserAnalyticsEntry[]>(
      `/api/v1/auth/analytics/admin/user-analytics?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get failure analytics (Admin only)
   */
  async getFailureAnalytics(query?: AuthAnalyticsQuery): Promise<FailureAnalyticsEntry[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await apiClient.get<FailureAnalyticsEntry[]>(
      `/api/v1/auth/analytics/admin/failure-analytics?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get chart data for authentication trends
   */
  async getAuthTrendsChart(query?: AuthAnalyticsQuery): Promise<AuthAnalyticsChartData[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval || 'day');

    // This could be derived from system stats or a separate endpoint
    const systemStats = await this.getSystemAuthStats(query);
    
    // Mock chart data based on system stats - in production this would be a dedicated endpoint
    const chartData: AuthAnalyticsChartData[] = [];
    const days = query?.interval === 'week' ? 7 : query?.interval === 'month' ? 30 : 7;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        total_logins: Math.floor(systemStats.total_logins_today * (0.7 + Math.random() * 0.6)),
        successful_logins: Math.floor(systemStats.total_logins_today * (0.7 + Math.random() * 0.6) * (systemStats.success_rate_today / 100)),
        failed_logins: Math.floor(systemStats.failed_logins_today * (0.5 + Math.random() * 1.0)),
        unique_users: Math.floor(systemStats.active_users_today * (0.8 + Math.random() * 0.4)),
        new_registrations: Math.floor(Math.random() * 10),
      });
    }
    
    return chartData;
  }
}

export const authAnalyticsService = new AuthAnalyticsService();
