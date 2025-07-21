// Analytics Types based on swagger.yaml definitions

// ============= Common Interfaces =============

export interface AnalyticsRequestInfo {
  cache_hit: boolean
  data_sources: string[]
  processed_at: string
  processing_time_ms: number
  request_id: string
  version: string
}

export interface ComponentStatus {
  last_check: string
  latency: number
  message: string
  status: string
}

export interface MetaInfo {
  pagination?: {
    page: number
    limit: number
    total: number
    has_next: boolean
    has_previous: boolean
  }
  filters?: Record<string, unknown>
  time_range?: {
    start_time: string
    end_time: string
  }
}

// ============= System Analytics =============

export interface SystemDashboardAnalytics {
  active_sessions: number
  active_tenants: number
  active_users: number
  login_activity_chart: LoginActivityItem[]
  new_users_this_month: number
  new_users_this_week: number
  new_users_today: number
  security_overview: SystemSecurityOverview
  tenant_stats: TenantStatsItem[]
  top_devices: DeviceStatsItem[]
  top_locations: LocationStatsItem[]
  total_sessions: number
  total_tenants: number
  total_users: number
  user_growth_chart: UserGrowthItem[]
}

export interface SystemSecurityOverview {
  blocked_ips: number
  failed_login_attempts: number
  failed_logins_this_week: number
  failed_logins_today: number
  suspicious_activities: number
  total_security_events: number
  users_2fa_enabled: number
  users_email_verified: number
  users_phone_verified: number
}

export interface LoginActivityItem {
  date: string
  failed_count: number
  login_count: number
  success_count: number
  success_rate: number
}

export interface UserGrowthItem {
  count: number
  date: string
}

export interface DeviceStatsItem {
  count: number
  device: string
}

export interface LocationStatsItem {
  count: number
  location: string
}

export interface TenantStatsItem {
  active_users: number
  created_at: string
  is_active: boolean
  last_active: string
  tenant_id: string
  tenant_name: string
  user_count: number
}

export interface SecurityEventItem {
  description: string
  details: string
  event_type: string
  ip_address: string
  occurred_at: string
  severity: string
  timestamp: string
}

// ============= Personal Analytics =============

export interface PersonalDashboardAnalytics {
  active_sessions_count: number
  activity_summary: UserActivitySummary
  device_stats: DeviceStatsItem[]
  last_login_at: string
  location_stats: LocationStatsItem[]
  login_history: LoginHistoryItem[]
  security_events: SecurityEventItem[]
  total_logins: number
  total_sessions: number
  user_id: string
}

export interface UserActivitySummary {
  actions_this_month: number
  actions_this_week: number
  actions_today: number
  last_active_at: string
  last_activity: string
  most_active_day: string
  most_active_hour: number
  preferred_device: string
  preferred_location: string
  total_actions: number
}

export interface LoginHistoryItem {
  ip_address: string
  location: string
  login_at: string
  success: boolean
  user_agent: string
}

// ============= Auth Analytics =============

export interface AuthDashboardResponse {
  generated_at: string
  login_analytics: LoginAnalyticsResponse
  recent_logins: RecentLoginsResponse
  summary: AuthDashboardSummary
}

export interface AuthDashboardSummary {
  active_sessions: number
  critical_events: number
  failed_logins_count: number
  recent_logins_count: number
  security_events: number
  success_rate: number
  successful_logins_count: number
  total_logins_count: number
  total_sessions: number
}

export interface LoginAnalyticsResponse {
  data: LoginData[]
  meta: MetaInfo
  request_info: AnalyticsRequestInfo
}

export interface RecentLoginsResponse {
  data: LoginData[]
  meta: MetaInfo
  request_info: AnalyticsRequestInfo
}

export interface LoginData {
  user_id: string
  timestamp: string
  success: boolean
  ip_address: string
  user_agent: string
  location?: string
  device_type?: string
  error_message?: string
}

// ============= DID Analytics =============

export interface DIDDashboardResponse {
  creation_metrics: DIDCreationSummary
  overview: DIDOverviewMetrics
  performance_metrics: DIDPerformanceMetrics
  recent_activity: DIDActivity[]
  request_info: AnalyticsRequestInfo
  resolution_metrics: DIDResolutionSummary
  security_metrics: DIDSecuritySummary
}

export interface DIDCreationSummary {
  created_today: number
  success_rate: number
  top_methods: string[]
  total_created: number
  trend_direction: string
}

export interface DIDOverviewMetrics {
  active_dids: number
  dids_created_today: number
  dids_resolved_today: number
  last_updated: string
  system_health: string
  total_dids: number
}

export interface DIDPerformanceMetrics {
  average_creation_time: number
  average_resolution_time: number
  average_verify_time: number
  error_rate: number
  p95_response_time: number
  p99_response_time: number
  success_rate: number
  throughput_per_second: number
}

export interface DIDResolutionSummary {
  average_time: number
  resolved_today: number
  success_rate: number
  total_resolutions: number
  trend_direction: string
}

export interface DIDSecuritySummary {
  compromised_dids: number
  security_events: number
  threat_level: string
}

export interface DIDActivity {
  description: string
  did: string
  id: string
  metadata: Record<string, unknown>
  status: string
  timestamp: string
  type: string
}

export interface DIDCreationMetricsResponse {
  creations_by_method: Record<string, number>
  creations_by_status: Record<string, number>
  daily_creations: DIDDailyMetric[]
  failed_created: number
  method_distribution: DIDMethodDistribution[]
  request_info: AnalyticsRequestInfo
  successful_created: number
  total_created: number
}

export interface DIDDailyMetric {
  avg_time: number
  count: number
  date: string
  method: string
  status: string
}

export interface DIDMethodDistribution {
  count: number
  method: string
  percentage: number
}

// ============= KMS Analytics =============

export interface KMSDashboardResponse {
  compliance_metrics: KMSComplianceSummary
  overview_metrics: KMSOverviewMetrics
  performance_metrics: KMSPerformanceMetrics
  recent_activity: KMSActivity[]
  request_info: AnalyticsRequestInfo
  security_summary: KMSSecuritySummary
}

export interface KMSOverviewMetrics {
  active_keys: number
  keys_created_today: number
  operations_today: number
  system_health: string
  total_keys: number
}

export interface KMSPerformanceMetrics {
  average_decrypt_time: number
  average_encrypt_time: number
  average_key_generation_time: number
  error_rate: number
  operations_per_second: number
  success_rate: number
}

export interface KMSComplianceSummary {
  active_standards: string[]
  compliance_score: number
  last_audit: string
  violations: number
}

export interface KMSSecuritySummary {
  failed_operations: number
  security_events: number
  threat_level: string
  unauthorized_access_attempts: number
}

export interface KMSActivity {
  description: string
  id: string
  key_id: string
  operation: string
  status: string
  timestamp: string
  user_id: string
}

// ============= OAuth2 Analytics =============

export interface OAuth2DashboardResponse {
  client_analytics: ClientAnalyticsResponse
  error_analytics: OAuth2ErrorAnalyticsResponse
  flow_analytics: OAuth2FlowAnalyticsResponse
  real_time_metrics: RealTimeOAuth2Response
  request_info: AnalyticsRequestInfo
  summary: DashboardSummary
}

export interface ClientAnalyticsResponse {
  active_clients: number
  client_performance: Record<string, ClientMetric>
  client_usage: Record<string, number>
  top_clients: ClientDetail[]
  total_clients: number
}

export interface ClientDetail {
  client_id: string
  client_name: string
  request_count: number
  success_rate: number
}

export interface ClientMetric {
  error_rate: number
  last_activity: string
  request_count: number
  success_rate: number
}

export interface OAuth2ErrorAnalyticsResponse {
  error_distribution: Record<string, number>
  error_trends: ErrorDetail[]
  most_common_errors: ErrorDetail[]
  request_info: AnalyticsRequestInfo
}

export interface ErrorDetail {
  count: number
  error_code: string
  error_type: string
  percentage: number
}

export interface OAuth2FlowAnalyticsResponse {
  authorization_code_flows: number
  client_credentials_flows: number
  flow_success_rates: Record<string, number>
  implicit_flows: number
  request_info: AnalyticsRequestInfo
  total_flows: number
}

export interface RealTimeOAuth2Response {
  active_sessions: number
  current_flows: number
  live_alerts: RealTimeAlert[]
  performance_kpis: PerformanceKPI[]
}

export interface RealTimeAlert {
  alert_type: string
  description: string
  id: string
  severity: string
  timestamp: string
}

export interface PerformanceKPI {
  name: string
  current_value: number
  target_value: number
  trend: string
}

export interface DashboardSummary {
  active_clients: number
  error_rate: number
  success_rate: number
  total_requests: number
}

// ============= Legacy Credential Analytics (keeping for backward compatibility) =============

export interface CredentialAnalyticsQuery {
  start_date?: string;    // YYYY-MM-DD format
  end_date?: string;      // YYYY-MM-DD format
  interval?: 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
  tenant_id?: string;
  issuer_did?: string;
  tags?: string;          // comma-separated list
}

export interface AnalyticsPeriod {
  start_date: string;
  end_date: string;
  interval: string;
}

export interface OverviewMetrics {
  total_credentials: number;
  active_credentials: number;
  revoked_credentials: number;
  deactivated_credentials: number;
}

export interface TypeBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export interface IssuerBreakdown {
  issuer_did: string;
  issuer_name?: string;
  count: number;
  percentage: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

// Timeline data point
export interface TimelineDataPoint {
  date: string;
  count: number;
}

// Active period information
export interface ActivePeriod {
  period: string;
  count: number;
  date_range: {
    start: string;
    end: string;
  };
}

// Issuance metrics
export interface IssuanceMetrics {
  total_issued: number;
  issued_today: number;
  issued_this_week: number;
  issued_this_month: number;
  avg_issuance_time_seconds: number;
  issued_by_template: TypeBreakdown[];
  issued_by_type: TypeBreakdown[];
  issued_by_status: StatusBreakdown[];
  issuance_timeline: TimelineDataPoint[];
  most_active_issuance_period: ActivePeriod;
}

// Received metrics
export interface ReceivedMetrics {
  total_received: number;
  received_today: number;
  received_this_week: number;
  received_this_month: number;
  verification_success_rate: number;
  received_by_issuer: IssuerBreakdown[];
  received_by_type: TypeBreakdown[];
  received_by_status: StatusBreakdown[];
  received_timeline: TimelineDataPoint[];
  most_active_receiving_period: ActivePeriod;
}

// Reason breakdown
export interface ReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

// Active credentials details
export interface ActiveCredentialsMetrics {
  count: number;
  by_type: TypeBreakdown[];
  by_issuer: IssuerBreakdown[];
  average_age_days: number;
  expiring_within_30_days: number;
}

// Revoked credentials details
export interface RevokedCredentialsMetrics {
  count: number;
  revoked_today: number;
  revoked_this_week: number;
  revoked_this_month: number;
  by_reason: ReasonBreakdown[];
  by_type: TypeBreakdown[];
  revocation_timeline: TimelineDataPoint[];
}

// Deactivated credentials details
export interface DeactivatedCredentialsMetrics {
  count: number;
  deactivated_today: number;
  deactivated_this_week: number;
  deactivated_this_month: number;
  by_reason: ReasonBreakdown[];
  by_type: TypeBreakdown[];
  deactivation_timeline: TimelineDataPoint[];
}

// Status metrics container
export interface StatusMetrics {
  active_credentials: ActiveCredentialsMetrics;
  revoked_credentials: RevokedCredentialsMetrics;
  deactivated_credentials: DeactivatedCredentialsMetrics;
}

// Applied filters
export interface AppliedFilters {
  start_date?: string;
  end_date?: string;
  interval?: string;
  tenant_id?: string;
  issuer_did?: string;
  tags?: string[];
}

// Main analytics response (removed activity_timeline and trend_analysis)
export interface UserCredentialAnalyticsResponse {
  user_id: string;
  generated_at: string;
  period: AnalyticsPeriod;
  overview_metrics: OverviewMetrics;
  issuance_metrics: IssuanceMetrics;
  received_metrics: ReceivedMetrics;
  status_metrics: StatusMetrics;
  filters_applied: AppliedFilters;
}

// ============= Additional Missing Response Types =============

export interface DIDMethodMetricsResponse {
  adoption_trends: DIDAdoptionTrend[]
  method_comparison: DIDMethodComparison
  method_statistics: DIDMethodStatistics[]
  request_info: AnalyticsRequestInfo
}

export interface DIDAdoptionTrend {
  count: number
  date: string
  growth: number
  method: string
}

export interface DIDMethodComparison {
  fastest: string
  method_metrics: DIDMethodStatistics[]
  most_reliable: string
  most_used: string
  top_performing: string
}

export interface DIDMethodStatistics {
  average_response_time: number
  error_count: number
  last_used: string
  method: string
  success_rate: number
  total_count: number
}

export interface DIDResolutionMetricsResponse {
  average_response_time: number
  daily_resolutions: DIDDailyMetric[]
  failed_resolutions: number
  performance_metrics: DIDPerformanceMetrics
  request_info: AnalyticsRequestInfo
  resolutions_by_method: Record<string, number>
  resolutions_by_status: Record<string, number>
  successful_resolutions: number
  total_resolutions: number
}

export interface DIDPerformanceMetricsResponse {
  operation_metrics: DIDOperationMetric[]
  performance_metrics: DIDPerformanceMetrics
  request_info: AnalyticsRequestInfo
  system_health: DIDSystemHealth
}

export interface DIDOperationMetric {
  average_time: number
  count: number
  error_rate: number
  operation: string
  success_rate: number
  total_time: number
}

export interface DIDSystemHealth {
  active_connections: number
  status: string
  uptime: number
}

export interface DIDSecurityMetricsResponse {
  compromised_dids: number
  recent_events: DIDSecurityEvent[]
  request_info: AnalyticsRequestInfo
  security_summary: DIDSecuritySummary
  threat_analysis: Record<string, unknown>
}

export interface DIDSecurityEvent {
  description: string
  did: string
  event_type: string
  id: string
  metadata: Record<string, unknown>
  severity: string
  timestamp: string
}

export interface DIDVerificationMetricsResponse {
  average_verification_time: number
  daily_verifications: DIDDailyMetric[]
  request_info: AnalyticsRequestInfo
  verification_success_rate: number
  verifications_by_method: Record<string, number>
}

// ============= KMS Response Types =============

export interface KMSKeyManagementMetricsResponse {
  daily_operations: KMSDailyMetric[]
  key_lifecycle_metrics: KMSKeyLifecycleMetrics
  key_rotation_metrics: KMSKeyRotationMetrics
  operations_summary: KMSOperationSummary[]
  request_info: AnalyticsRequestInfo
}

export interface KMSDailyMetric {
  algorithm: string
  count: number
  date: string
  operation: string
  status: string
}

export interface KMSKeyLifecycleMetrics {
  average_key_age_days: number
  keys_created: number
  keys_expired: number
  keys_revoked: number
  total_active_keys: number
}

export interface KMSKeyRotationMetrics {
  average_rotation_interval_days: number
  keys_due_rotation: number
  last_rotation: string
  rotation_schedule: KMSKeyRotationSchedule[]
}

export interface KMSKeyRotationSchedule {
  key_alias: string
  last_rotation: string
  next_rotation: string
  status: string
}

export interface KMSOperationSummary {
  average_time: number
  count: number
  error_rate: number
  operation: string
  success_rate: number
}

export interface KMSCryptographicMetricsResponse {
  algorithm_usage: Record<string, number>
  daily_operations: KMSDailyMetric[]
  operation_metrics: KMSOperationMetric[]
  request_info: AnalyticsRequestInfo
  throughput_metrics: KMSThroughputMetrics
}

export interface KMSOperationMetric {
  average_time: number
  count: number
  operation: string
  success_rate: number
}

export interface KMSThroughputMetrics {
  operations_per_hour: Record<string, number>
  peak_operations: number
  total_operations: number
}

export interface KMSSecurityMetricsResponse {
  audit_events: KMSAuditEvent[]
  recent_threats: KMSSecurityEvent[]
  request_info: AnalyticsRequestInfo
  security_overview: KMSSecuritySummary
}

export interface KMSAuditEvent {
  action: string
  id: string
  key_id: string
  result: string
  timestamp: string
  user_id: string
}

export interface KMSSecurityEvent {
  description: string
  event_type: string
  id: string
  severity: string
  timestamp: string
}

export interface KMSPerformanceMetricsResponse {
  latency_metrics: KMSLatencyMetrics
  operation_performance: KMSOperationMetric[]
  request_info: AnalyticsRequestInfo
  system_status: KMSSystemStatus
}

export interface KMSLatencyMetrics {
  average_latency: number
  p95_latency: number
  p99_latency: number
}

export interface KMSSystemStatus {
  health: string
  last_check: string
  status: string
}

export interface KMSComplianceMetricsResponse {
  audit_trail: KMSAuditEvent[]
  certification_status: KMSCertificationStatus
  compliance_status: KMSComplianceStatus
  request_info: AnalyticsRequestInfo
}

export interface KMSCertificationStatus {
  certifications: KMSCertification[]
  expiring_soon: string[]
  status: string
}

export interface KMSCertification {
  expires_at: string
  issued_at: string
  issuer: string
  name: string
  status: string
}

export interface KMSComplianceStatus {
  certification_expiry: string
  compliance_score: number
  last_assessment: string
  standards: string[]
}

export interface KMSRealTimeMetricsResponse {
  last_updated: string
  live_metrics: KMSLiveMetrics
  live_performance: LivePerformance
  live_security: LiveSecurity
  realtime_events: KMSRealtimeEvent[]
}

export interface KMSLiveMetrics {
  active_keys: number
  current_operations: number
  system_load: number
}

export interface LivePerformance {
  current_latency: number
  operations_per_minute: number
  success_rate: number
}

export interface LiveSecurity {
  active_threats: number
  failed_operations: number
  security_level: string
}

export interface KMSRealtimeEvent {
  duration: number
  event_type: string
  key_id: string
  operation: string
  status: string
  timestamp: string
}

// ============= System Health Types =============

export interface SystemHealthResponse {
  components: SystemComponents
  overall_status: string
  timestamp: string
  uptime: number
}

export interface SystemComponents {
  database: ComponentStatus
  redis: ComponentStatus
  external_apis: ComponentStatus
  authentication: ComponentStatus
}

export interface SystemEventsResponse {
  events: ActivityDetail[]
  meta: MetaInfo
  request_info: AnalyticsRequestInfo
}

export interface ActivityDetail {
  action: string
  client_id: string
  ip_address: string
  response_time_ms: number
  status: string
  timestamp: string
  user_id: string
}

// ============= Request/Response Common Types =============

export interface TimeRangeRequest {
  start_time?: string
  end_time?: string
}

export interface PaginatedRequest {
  page?: number
  limit?: number
  offset?: number
}

export interface FilterRequest {
  filters?: Record<string, unknown>
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export type AnalyticsRequest = TimeRangeRequest & PaginatedRequest & FilterRequest

// Service error for analytics
export class AnalyticsServiceError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AnalyticsServiceError';
    this.code = code;
    this.details = details;
  }
}

// All types are already exported with their individual declarations
