/**
 * Types for Security Events
 */

// Types for Security Events
export interface SecurityEvent {
  id: string
  event_type: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata: Record<string, unknown>
}

export interface SecurityOverview {
  total_events: number
  critical_events: number
  high_events: number
  medium_events: number
  low_events: number
  events_today: number
  resolved_today: number
}

export interface SecurityEventsFilter {
  severity?: string
  event_type?: string
  user_id?: string
  tenant_id?: string
  start_date?: string
  end_date?: string
  date_from?: string
  date_to?: string
  ip_address?: string
  page?: number
  limit?: number
  offset?: number
}

export interface SecurityEventsResponse {
  events: SecurityEvent[]
  total: number
  page: number
  limit: number
}