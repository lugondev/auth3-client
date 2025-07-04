/**
 * Types for comprehensive credential analytics
 * Based on the backend DDD analytics implementation
 */

// Query parameters for analytics endpoints
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

// Time period information
export interface AnalyticsPeriod {
  start_date: string;
  end_date: string;
  interval: string;
}

// Overview metrics
export interface OverviewMetrics {
  total_credentials: number;
  active_credentials: number;
  revoked_credentials: number;
  deactivated_credentials: number;
}

// Type/template breakdown
export interface TypeBreakdown {
  type: string;
  count: number;
  percentage: number;
}

// Issuer breakdown (removed trust_score to match backend)
export interface IssuerBreakdown {
  issuer_did: string;
  issuer_name?: string;
  count: number;
  percentage: number;
}

// Status breakdown
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
