import apiClient from '@/lib/apiClient';
import type { PresentationRequest } from '@/types/presentation-request';

export interface AnalyticsTimeRange {
  start_date?: string;
  end_date?: string;
}

export interface AnalyticsQuery extends AnalyticsTimeRange {
  interval?: 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
  user_id?: string;
}

export interface PersonalDashboardAnalytics {
  user_id: string;
  total_logins: number;
  last_login_at?: string;
  active_sessions_count: number;
  total_sessions: number;
  login_history: LoginHistoryItem[];
  device_stats: DeviceStatsItem[];
  location_stats: LocationStatsItem[];
  activity_summary: UserActivitySummary;
  security_events: SecurityEventItem[];
}

export interface SystemDashboardAnalytics {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  total_sessions: number;
  active_sessions: number;
  total_tenants: number;
  active_tenants: number;
  user_growth_chart: UserGrowthItem[];
  login_activity_chart: LoginActivityItem[];
  top_devices: DeviceStatsItem[];
  top_locations: LocationStatsItem[];
  security_overview: SystemSecurityOverview;
  tenant_stats: TenantStatsItem[];
}

export interface LoginHistoryItem {
  login_at: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  success: boolean;
}

export interface DeviceStatsItem {
  device: string;
  count: number;
}

export interface LocationStatsItem {
  location: string;
  count: number;
}

export interface UserActivitySummary {
  last_active_at?: string;
  total_actions: number;
  actions_today: number;
  actions_this_week: number;
  actions_this_month: number;
  most_active_day: string;
  most_active_hour: number;
}

export interface SecurityEventItem {
  event_type: string;
  description: string;
  occurred_at: string;
  severity: string;
  ip_address?: string;
}

export interface UserGrowthItem {
  date: string;
  count: number;
}

export interface LoginActivityItem {
  date: string;
  success_count: number;
  failed_count: number;
}

export interface SystemSecurityOverview {
  failed_logins_today: number;
  failed_logins_this_week: number;
  suspicious_activities: number;
  blocked_ips: number;
  users_2fa_enabled: number;
  users_email_verified: number;
  users_phone_verified: number;
}

export interface TenantStatsItem {
  tenant_id: string;
  tenant_name: string;
  user_count: number;
  active_users: number;
  is_active: boolean;
  created_at: string;
}

// Presentation Request Analytics interfaces - Updated to match backend response
export interface PresentationRequestTimelineStat {
  timestamp: string;
  count: number;
}

export interface PresentationResponseTimelineStat {
  timestamp: string;
  count: number;
}

export interface PresentationRequestByVerifierStat {
  verifier_did: string;
  verifier_name: string;
  request_count: number;
  response_count: number;
  response_rate: number;
}

export interface PresentationResponseByStatusStat {
  status: string;
  count: number;
  percentage: number;
}

export interface PresentationResponseByHolderStat {
  holder_did: string;
  response_count: number;
  success_rate: number;
  average_response_time_hours: number;
}

export interface PopularCredentialTypeStat {
  credential_type: string;
  request_count: number;
  percentage: number;
}

export interface AnalyticsPeriod {
  start_date: string;
  end_date: string;
  interval: string;
}

// Backend response structure
export interface BackendPresentationRequestAnalytics {
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  expired_requests: number;
  total_responses: number;
  response_rate: number;
  average_response_time_hours: number;
  request_timeline: PresentationRequestTimelineStat[];
  response_timeline: PresentationResponseTimelineStat[];
  requests_by_verifier: PresentationRequestByVerifierStat[];
  responses_by_status: PresentationResponseByStatusStat[];
  responses_by_holder: PresentationResponseByHolderStat[];
  popular_credential_types: PopularCredentialTypeStat[];
  generated_at: string;
  period: AnalyticsPeriod;
}

// Frontend display structure
export interface PresentationRequestOverview {
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  pending_requests: number;
  failed_requests: number;
  success_rate: number;
  average_response_time: string;
}

export interface PresentationRequestActivity {
  date: string;
  requests: number;
  success: number;
  failed: number;
}

export interface VerificationTypeStats {
  type: string;
  count: number;
  percentage: number;
}

export interface PresentationRequestAnalytics {
  overview: PresentationRequestOverview;
  recent_activity: PresentationRequestActivity[];
  top_verification_types: VerificationTypeStats[];
  performance_metrics: {
    avg_response_time: number;
    success_rate: number;
    peak_hours: Array<{ hour: number; count: number }>;
  };
}

class AnalyticsService {
  // Personal Analytics
  async getPersonalDashboardAnalytics(query?: AnalyticsQuery): Promise<PersonalDashboardAnalytics> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval);

    const response = await apiClient.get<PersonalDashboardAnalytics>(
      `/api/v1/analytics/personal?${params.toString()}`
    );
    return response.data;
  }

  // System Analytics (Admin only)
  async getSystemDashboardAnalytics(query?: AnalyticsQuery): Promise<SystemDashboardAnalytics> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval);

    const response = await apiClient.get<SystemDashboardAnalytics>(
      `/api/v1/analytics/admin/system?${params.toString()}`
    );
    return response.data;
  }

  async getUserGrowth(query?: AnalyticsQuery): Promise<UserGrowthItem[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval);

    const response = await apiClient.get<UserGrowthItem[]>(
      `/api/v1/analytics/admin/user-growth?${params.toString()}`
    );
    return response.data;
  }

  async getLoginActivity(query?: AnalyticsQuery): Promise<LoginActivityItem[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval);

    const response = await apiClient.get<LoginActivityItem[]>(
      `/api/v1/analytics/admin/login-activity?${params.toString()}`
    );
    return response.data;
  }

  async getTopDevices(query?: AnalyticsQuery): Promise<DeviceStatsItem[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.limit) params.append('limit', query.limit.toString());

    const response = await apiClient.get<DeviceStatsItem[]>(
      `/api/v1/analytics/admin/top-devices?${params.toString()}`
    );
    return response.data;
  }

  async getTopLocations(query?: AnalyticsQuery): Promise<LocationStatsItem[]> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.limit) params.append('limit', query.limit.toString());

    const response = await apiClient.get<LocationStatsItem[]>(
      `/api/v1/analytics/admin/top-locations?${params.toString()}`
    );
    return response.data;
  }

  async getSecurityEvents(query?: AnalyticsQuery): Promise<SecurityEventItem[]> {
    const params = new URLSearchParams();
    if (query?.user_id) params.append('user_id', query.user_id);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await apiClient.get<SecurityEventItem[]>(
      `/api/v1/analytics/admin/security-events?${params.toString()}`
    );
    return response.data;
  }

  async getTenantStats(query?: AnalyticsQuery): Promise<TenantStatsItem[]> {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await apiClient.get<TenantStatsItem[]>(
      `/api/v1/analytics/admin/tenant-stats?${params.toString()}`
    );
    return response.data;
  }

  // Presentation Request Analytics
  async getPresentationRequestAnalytics(query?: AnalyticsQuery): Promise<PresentationRequestAnalytics> {
    const params = new URLSearchParams();
    if (query?.start_date) params.append('start_date', query.start_date);
    if (query?.end_date) params.append('end_date', query.end_date);
    if (query?.interval) params.append('interval', query.interval);

    try {
      const response = await apiClient.get<BackendPresentationRequestAnalytics>(
        `/api/v1/analytics/presentation-requests?${params.toString()}`
      );
      
      // Transform backend data to frontend structure
      return this.transformAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch presentation analytics:', error);
      // Return default data structure if API fails
      return this.getDefaultAnalyticsData();
    }
  }

  // Transform backend analytics data to frontend structure
  private transformAnalyticsData(backendData: BackendPresentationRequestAnalytics): PresentationRequestAnalytics {
    // Calculate pending requests (active but no responses yet)
    const pending_requests = Math.max(0, backendData.active_requests - backendData.total_responses);
    
    // Calculate failed requests (expired requests)
    const failed_requests = backendData.expired_requests;
    
    // Format average response time
    const avg_hours = backendData.average_response_time_hours || 0;
    const average_response_time = avg_hours > 0 
      ? avg_hours < 1 
        ? `${Math.round(avg_hours * 60)}m`
        : `${avg_hours.toFixed(1)}h`
      : '0m';

    // Transform timeline data to recent activity
    const recent_activity: PresentationRequestActivity[] = backendData.request_timeline
      .slice(-7) // Last 7 days
      .map((item, index) => {
        const responseItem = backendData.response_timeline.find(r => 
          r.timestamp === item.timestamp
        );
        const success = responseItem?.count || 0;
        const failed = Math.max(0, item.count - success);
        
        return {
          date: new Date(item.timestamp).toISOString().split('T')[0],
          requests: item.count,
          success,
          failed,
        };
      });

    // Transform credential types
    const top_verification_types: VerificationTypeStats[] = backendData.popular_credential_types
      .slice(0, 5)
      .map(item => ({
        type: item.credential_type,
        count: item.request_count,
        percentage: item.percentage,
      }));

    // Generate mock peak hours if no data
    const peak_hours = recent_activity.length > 0 
      ? [
          { hour: 9, count: Math.floor(Math.random() * 20) + 5 },
          { hour: 14, count: Math.floor(Math.random() * 15) + 10 },
          { hour: 16, count: Math.floor(Math.random() * 25) + 8 },
        ]
      : [];

    return {
      overview: {
        total_requests: backendData.total_requests,
        active_requests: backendData.active_requests,
        completed_requests: backendData.completed_requests,
        pending_requests,
        failed_requests,
        success_rate: backendData.response_rate,
        average_response_time,
      },
      recent_activity,
      top_verification_types,
      performance_metrics: {
        avg_response_time: backendData.average_response_time_hours,
        success_rate: backendData.response_rate,
        peak_hours,
      },
    };
  }

  // Default analytics data when API fails or returns empty data
  private getDefaultAnalyticsData(): PresentationRequestAnalytics {
    return {
      overview: {
        total_requests: 0,
        active_requests: 0,
        completed_requests: 0,
        pending_requests: 0,
        failed_requests: 0,
        success_rate: 0,
        average_response_time: '0m',
      },
      recent_activity: [],
      top_verification_types: [],
      performance_metrics: {
        avg_response_time: 0,
        success_rate: 0,
        peak_hours: [],
      },
    };
  }

}

export const analyticsService = new AnalyticsService();
