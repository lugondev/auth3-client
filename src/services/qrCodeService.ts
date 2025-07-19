import apiClient from "@/lib/apiClient";
import { withErrorHandling } from './errorHandlingService';

// QR Code Generation Types
export interface QRCodeGenerateRequest {
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export interface QRCodeGenerateResponse {
  session_id: string;
  qr_code_data: string;
  qr_code_url: string;
  poll_url: string;
  expires_at: string;
  expires_in: number;
  settings: {
    poll_interval: number;
    max_poll_duration: number;
    timeout_warning: number;
  };
}

// QR Code Scanning Types
export interface QRCodeScanRequest {
  challenge?: string; // Optional challenge from QR code
}

export interface QRCodeScanResponse {
  session_id: string;
  client_info: {
    client_id: string;
    name: string;
    description: string;
    logo_uri?: string;
    client_uri?: string;
  };
  requested_scope: string[];
  authorize_url: string;
  reject_url: string;
  expires_at: string;
  message: string;
}

// QR Code Status/Poll Types
export interface QRCodeStatusResponse {
  session_id: string;
  status: 'pending' | 'scanned' | 'authorized' | 'rejected' | 'expired';
  is_scanned: boolean;
  scanned_at?: string;
  auth_code?: string;
  state?: string;
  redirect_uri?: string;
  error_code?: string;
  error_description?: string;
  expires_at: string;
  expires_in: number;
  next_action: 'wait' | 'redirect' | 'retry' | 'error';
  message: string;
}

// QR Code Authorization Types
export interface QRCodeAuthorizeRequest {
  approved: boolean;
  scopes?: string[];
  user_info?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface QRCodeAuthorizeResponse {
  session_id: string;
  status: string;
  auth_code?: string;
  redirect_uri?: string;
  message: string;
}

const baseURL = "/api/v1/oauth2/qr";

// Generate QR Code for authentication
export const generateQRCode = withErrorHandling(
  async (data: QRCodeGenerateRequest): Promise<QRCodeGenerateResponse> => {
    const response = await apiClient.post<QRCodeGenerateResponse>(`${baseURL}/generate`, data);
    return response.data;
  }
);

// Scan QR Code (mobile app)
export const scanQRCode = withErrorHandling(
  async (sessionId: string, data?: QRCodeScanRequest): Promise<QRCodeScanResponse> => {
    const response = await apiClient.post<QRCodeScanResponse>(`${baseURL}/scan/${sessionId}`, data || {});
    return response.data;
  }
);

// Get QR Code session status (polling)
export const getQRCodeStatus = withErrorHandling(
  async (sessionId: string): Promise<QRCodeStatusResponse> => {
    const response = await apiClient.get<QRCodeStatusResponse>(`${baseURL}/status/${sessionId}`);
    return response.data;
  }
);

// Authorize QR Code session (approve/deny)
export const authorizeQRCode = withErrorHandling(
  async (sessionId: string, data: QRCodeAuthorizeRequest): Promise<QRCodeAuthorizeResponse> => {
    const response = await apiClient.post<QRCodeAuthorizeResponse>(`${baseURL}/authorize/${sessionId}`, data);
    return response.data;
  }
);

// Reject QR Code session
export const rejectQRCode = withErrorHandling(
  async (sessionId: string, reason?: string): Promise<{ message: string; session_id: string }> => {
    const url = reason 
      ? `${baseURL}/reject/${sessionId}?reason=${encodeURIComponent(reason)}`
      : `${baseURL}/reject/${sessionId}`;
    const response = await apiClient.post<{ message: string; session_id: string }>(url);
    return response.data;
  }
);

// Cancel QR Code session
export const cancelQRCode = withErrorHandling(
  async (sessionId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${baseURL}/cancel/${sessionId}`);
    return response.data;
  }
);

// QR Code Analytics (Admin)
export interface QRCodeAnalytics {
  total_sessions: number;
  successful_logins: number;
  failed_attempts: number;
  active_sessions: number;
  avg_scan_time: number;
  success_rate: number;
  sessions_by_status: {
    pending: number;
    scanned: number;
    authorized: number;
    rejected: number;
    expired: number;
  };
  daily_stats: Array<{
    date: string;
    sessions: number;
    successful: number;
    failed: number;
  }>;
}

export const getQRCodeAnalytics = withErrorHandling(
  async (timeRange?: string): Promise<QRCodeAnalytics> => {
    const params = timeRange ? `?range=${timeRange}` : '';
    const response = await apiClient.get<QRCodeAnalytics>(`${baseURL}/analytics${params}`);
    return response.data;
  }
);

// Real-time metrics
export interface QRCodeMetrics {
  active_sessions: number;
  scans_per_minute: number;
  success_rate_24h: number;
  avg_response_time: number;
  recent_sessions: Array<{
    session_id: string;
    status: string;
    created_at: string;
    client_name: string;
  }>;
}

export const getQRCodeMetrics = withErrorHandling(
  async (): Promise<QRCodeMetrics> => {
    const response = await apiClient.get<QRCodeMetrics>(`${baseURL}/metrics`);
    return response.data;
  }
);

// QR Code Settings (Admin)
export interface QRCodeSettings {
  enabled: boolean;
  session_timeout: number;
  poll_interval: number;
  max_poll_duration: number;
  rate_limit: {
    requests_per_minute: number;
    burst_limit: number;
  };
  security: {
    require_device_verification: boolean;
    log_device_info: boolean;
    block_suspicious_requests: boolean;
  };
}

export const getQRCodeSettings = withErrorHandling(
  async (): Promise<QRCodeSettings> => {
    const response = await apiClient.get<QRCodeSettings>(`${baseURL}/settings`);
    return response.data;
  }
);

export const updateQRCodeSettings = withErrorHandling(
  async (settings: Partial<QRCodeSettings>): Promise<QRCodeSettings> => {
    const response = await apiClient.put<QRCodeSettings>(`${baseURL}/settings`, settings);
    return response.data;
  }
);

// Admin session management
export interface QRCodeSession {
  session_id: string;
  client_id: string;
  client_name: string;
  redirect_uri: string;
  scope: string[];
  status: string;
  is_scanned: boolean;
  scanned_at?: string;
  device_info?: string;
  location?: string;
  user_id?: string;
  user_email?: string;
  created_at: string;
  expires_at: string;
  last_poll_at?: string;
}

export interface QRCodeSessionListResponse {
  sessions: QRCodeSession[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export const getQRCodeSessions = withErrorHandling(
  async (
    page: number = 1,
    limit: number = 20,
    status?: string,
    client_id?: string
  ): Promise<QRCodeSessionListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (client_id) params.append('client_id', client_id);

    const response = await apiClient.get<QRCodeSessionListResponse>(`${baseURL}/sessions?${params}`);
    return response.data;
  }
);

const qrCodeService = {
  generateQRCode,
  scanQRCode,
  getQRCodeStatus,
  authorizeQRCode,
  cancelQRCode,
  getQRCodeAnalytics,
  getQRCodeMetrics,
  getQRCodeSettings,
  updateQRCodeSettings,
  getQRCodeSessions,
};

export default qrCodeService;
