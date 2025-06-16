import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import {
  AuditLogFilter,
  AuditLogResponse,
  AuditLogSummary,
} from '@/types/audit';

const baseURL = '/api/v1/audit';

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = withErrorHandling(
  async (filter: AuditLogFilter = {}): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();

    // Add filter parameters
    if (filter.user_id) params.append('user_id', filter.user_id);
    if (filter.tenant_id) params.append('tenant_id', filter.tenant_id);
    if (filter.action) params.append('action', filter.action);
    if (filter.resource_type) params.append('resource_type', filter.resource_type);
    if (filter.resource_id) params.append('resource_id', filter.resource_id);
    if (filter.risk_level) params.append('risk_level', filter.risk_level);
    if (filter.ip_address) params.append('ip_address', filter.ip_address);
    if (filter.date_from) params.append('date_from', filter.date_from);
    if (filter.date_to) params.append('date_to', filter.date_to);
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `${baseURL}/logs?${queryString}` : `${baseURL}/logs`;

    const response = await apiClient.get<AuditLogResponse>(url);
    return response.data;
  }
);

/**
 * Get audit logs for a specific user
 */
export const getUserAuditLogs = withErrorHandling(
  async (
    userId: string,
    filter: AuditLogFilter = {}
  ): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();

    // Add filter parameters
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());
    if (filter.date_from) params.append('date_from', filter.date_from);
    if (filter.date_to) params.append('date_to', filter.date_to);

    const queryString = params.toString();
    const url = queryString ? `${baseURL}/users/${userId}/logs?${queryString}` : `${baseURL}/users/${userId}/logs`;

    const response = await apiClient.get<AuditLogResponse>(url);
    return response.data;
  }
);

/**
 * Get audit logs for a specific resource
 */
export const getResourceAuditLogs = withErrorHandling(
  async (
    resourceType: string,
    filter: AuditLogFilter = {}
  ): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();

    // Add filter parameters
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());
    if (filter.date_from) params.append('date_from', filter.date_from);
    if (filter.date_to) params.append('date_to', filter.date_to);
    params.append('resource_type', resourceType);

    const queryString = params.toString();
    const url = `${baseURL}/logs?${queryString}`;

    const response = await apiClient.get<AuditLogResponse>(url);
    return response.data;
  }
);

/**
 * Get audit logs by action type
 */
export const getActionAuditLogs = withErrorHandling(
  async (
    actionType: string,
    filter: AuditLogFilter = {}
  ): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();

    // Add filter parameters
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());
    if (filter.date_from) params.append('date_from', filter.date_from);
    if (filter.date_to) params.append('date_to', filter.date_to);
    params.append('action', actionType);

    const queryString = params.toString();
    const url = `${baseURL}/logs?${queryString}`;

    const response = await apiClient.get<AuditLogResponse>(url);
    return response.data;
  }
);

/**
 * Search audit logs with advanced filtering
 */
export const searchAuditLogs = async (
  searchParams: Record<string, unknown>,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLogResponse> => {
  const response = await apiClient.post<AuditLogResponse>(
    `${baseURL}/search?limit=${limit}&offset=${offset}`,
    searchParams
  );
  return response.data;
};

/**
 * Get audit log summary/analytics
 */
export const getAuditLogSummary = async (filter: AuditLogFilter = {}): Promise<AuditLogSummary> => {
  const params = new URLSearchParams();

  // Add filter parameters
  if (filter.user_id) params.append('user_id', filter.user_id);
  if (filter.tenant_id) params.append('tenant_id', filter.tenant_id);
  if (filter.action) params.append('action', filter.action);
  if (filter.resource_type) params.append('resource_type', filter.resource_type);
  if (filter.date_from) params.append('date_from', filter.date_from);
  if (filter.date_to) params.append('date_to', filter.date_to);

  const queryString = params.toString();
  const url = queryString ? `${baseURL}/summary?${queryString}` : `${baseURL}/summary`;

  const response = await apiClient.get<AuditLogSummary>(url);
  return response.data;
};

/**
 * Get system logs (for admin use)
 */
export const getSystemLogs = async (filter: AuditLogFilter = {}): Promise<AuditLogResponse> => {
  return getAuditLogs({
    ...filter,
    limit: filter.limit || 100,
    offset: filter.offset || 0,
  });
};

/**
 * Get security events (high-risk audit logs)
 */
export const getSecurityEvents = async (filter: AuditLogFilter = {}): Promise<AuditLogResponse> => {
  return getAuditLogs({
    ...filter,
    risk_level: 'high',
    limit: filter.limit || 50,
    offset: filter.offset || 0,
  });
};

/**
 * Export audit logs (for compliance/reporting)
 */
export const exportAuditLogs = async (
  filter: AuditLogFilter = {},
  format: 'csv' | 'json' | 'xlsx' = 'csv'
): Promise<Blob> => {
  const params = new URLSearchParams();

  // Add filter parameters
  if (filter.user_id) params.append('user_id', filter.user_id);
  if (filter.tenant_id) params.append('tenant_id', filter.tenant_id);
  if (filter.action) params.append('action', filter.action);
  if (filter.resource_type) params.append('resource_type', filter.resource_type);
  if (filter.date_from) params.append('date_from', filter.date_from);
  if (filter.date_to) params.append('date_to', filter.date_to);
  params.append('format', format);

  const queryString = params.toString();
  const url = `${baseURL}/export?${queryString}`;

  const response = await apiClient.get(url, {
    responseType: 'blob',
  });

  return response.data as Blob;
};