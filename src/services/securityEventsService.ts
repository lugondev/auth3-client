import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import { SecurityEventItem } from './analyticsService';
import {
  SecurityEvent,
  SecurityOverview,
  SecurityEventsFilter,
  SecurityEventsResponse
} from '@/types/securityEvents';

/**
 * Security Events Service - Client-side service for managing security events
 * 
 * This service provides methods to interact with security events endpoints,
 * including retrieving security events, security overview, and analytics.
 */

/**
 * Get security events with filtering and pagination
 * @param filter - Optional filtering parameters
 * @returns Promise resolving to security events list
 */
export const getSecurityEvents = withErrorHandling(
  async (filter?: SecurityEventsFilter): Promise<SecurityEventsResponse> => {
    const params = new URLSearchParams();

    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());
    if (filter?.event_type) params.append('event_type', filter.event_type);
    if (filter?.severity) params.append('severity', filter.severity);
    if (filter?.user_id) params.append('user_id', filter.user_id);
    if (filter?.tenant_id) params.append('tenant_id', filter.tenant_id);
    if (filter?.date_from) params.append('date_from', filter.date_from);
    if (filter?.date_to) params.append('date_to', filter.date_to);
    if (filter?.ip_address) params.append('ip_address', filter.ip_address);

    const response = await apiClient.get<SecurityEventsResponse>(
      `/api/v1/security/events${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  }
);

/**
 * Get security overview with summary statistics
 * @returns Promise resolving to security overview data
 */
export const getSecurityOverview = withErrorHandling(
  async (): Promise<SecurityOverview> => {
    const response = await apiClient.get<SecurityOverview>('/api/v1/security/overview');
    return response.data;
  }
);

/**
 * Get security event by ID
 * @param eventId - Security event ID
 * @returns Promise resolving to security event details
 */
export const getSecurityEvent = withErrorHandling(
  async (eventId: string): Promise<SecurityEvent> => {
    const response = await apiClient.get<SecurityEvent>(`/api/v1/security/events/${eventId}`);
    return response.data;
  }
);

/**
 * Mark security event as reviewed
 * @param eventId - Security event ID
 * @returns Promise resolving when event is marked as reviewed
 */
export const markEventAsReviewed = withErrorHandling(
  async (eventId: string): Promise<void> => {
    await apiClient.patch(`/api/v1/security/events/${eventId}/reviewed`);
  }
);

/**
 * Get security events analytics data
 * @returns Promise resolving to security events analytics
 */
export const getSecurityEventsAnalytics = withErrorHandling(
  async (): Promise<SecurityEventItem[]> => {
    const response = await apiClient.get<SecurityEventItem[]>('/api/v1/security/events/analytics');
    return response.data;
  }
);

// Export as default service object
export const securityEventsService = {
  getSecurityEvents,
  getSecurityOverview,
  getSecurityEvent,
  markEventAsReviewed,
  getSecurityEventsAnalytics,
};

export default securityEventsService;