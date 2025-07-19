/**
 * QR Code Service - Handle QR scan and authorization operations
 */

import apiClient from '@/lib/apiClient';

export interface QRScanRequest {
  device_info: string;
  location: string;
  user_agent?: string;
}

export interface QRScanResult {
  session_id: string;
  client_name: string;
  client_description?: string;
  client_logo?: string;
  scope: string;
  redirect_uri: string;
  expires_at: string;
  status: 'pending' | 'scanned' | 'authorized' | 'rejected' | 'expired';
}

export interface QRAuthorizeRequest {
  user_id: string;
  approved: boolean;
  scopes?: string[];
}

export interface QRAuthorizeResult {
  success: boolean;
  message: string;
  auth_code?: string;
  redirect_uri?: string;
  access_token?: string;
  expires_in?: number;
}

export interface QRCodeResponse {
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

export interface QRCodeGenerateRequest {
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export interface PollResponse {
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

export interface QRServiceResponse<T> {
  data: T;
  message: string;
  status: number;
}

class QRService {
  private baseUrl = '/api/v1/oauth2/qr';

  /**
   * Scan QR code by session ID
   */
  async scanQRCode(sessionId: string, request: QRScanRequest): Promise<QRScanResult> {
    try {
      const response = await apiClient.post<QRServiceResponse<QRScanResult>>(
        `${this.baseUrl}/scan/${sessionId}`,
        request
      );
      return response.data.data;
    } catch (error) {
      console.error('QR scan failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to scan QR code');
    }
  }

  /**
   * Authorize login request
   */
  async authorizeLogin(sessionId: string, request: QRAuthorizeRequest): Promise<QRAuthorizeResult> {
    try {
      const response = await apiClient.post<QRServiceResponse<QRAuthorizeResult>>(
        `${this.baseUrl}/authorize/${sessionId}`,
        request
      );
      return response.data.data;
    } catch (error) {
      console.error('QR authorization failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to authorize login');
    }
  }

  /**
   * Reject login request
   */
  async rejectLogin(sessionId: string, request: QRAuthorizeRequest): Promise<QRAuthorizeResult> {
    try {
      const response = await apiClient.post<QRServiceResponse<QRAuthorizeResult>>(
        `${this.baseUrl}/reject/${sessionId}`,
        request
      );
      return response.data.data;
    } catch (error) {
      console.error('QR rejection failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reject login');
    }
  }

  /**
   * Get QR session status
   */
  async getSessionStatus(sessionId: string): Promise<QRScanResult> {
    try {
      const response = await apiClient.get<QRServiceResponse<QRScanResult>>(
        `${this.baseUrl}/status/${sessionId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get session status:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get session status');
    }
  }

  /**
   * Generate QR code for OAuth2 flow
   */
  async generateQRCode(request: QRCodeGenerateRequest): Promise<QRCodeResponse> {
    try {
      const response = await apiClient.post<QRCodeResponse>(
        `${this.baseUrl}/generate`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate QR code');
    }
  }

  /**
   * Poll QR code status for OAuth2 flow
   */
  async pollQRStatus(sessionId: string): Promise<PollResponse> {
    try {
      const response = await apiClient.get<PollResponse>(
        `${this.baseUrl}/poll/${sessionId}`
      );
      return response.data;
    } catch (error) {
      console.error('QR polling failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to poll QR status');
    }
  }

  /**
   * Create demo/fallback QR scan result for testing
   */
  createDemoScanResult(sessionId: string): QRScanResult {
    return {
      session_id: sessionId,
      client_name: 'Demo Web Application',
      client_description: 'Auth3 Demo Application for testing QR authentication',
      scope: 'openid profile email',
      redirect_uri: 'http://localhost:3000/auth/callback',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      status: 'scanned'
    };
  }

  /**
   * Create demo/fallback authorization result for testing
   */
  createDemoAuthResult(approved: boolean, authCode?: string): QRAuthorizeResult {
    return {
      success: approved,
      message: approved ? 'Login approved successfully' : 'Login request denied',
      auth_code: approved ? (authCode || `demo_auth_${Date.now()}`) : undefined,
      redirect_uri: approved ? 'http://localhost:3000/auth/callback' : undefined,
      access_token: approved ? `demo_token_${Date.now()}` : undefined,
      expires_in: approved ? 3600 : undefined
    };
  }

  /**
   * Extract session ID from QR code content or URL
   */
  extractSessionId(qrContent: string): string | null {
    // Try to extract session ID from various QR code formats
    const patterns = [
      /session[_-]?id[=:]([a-f0-9-]+)/i,
      /oauth2\/qr\/([a-f0-9-]+)/i,
      /qr[_-]?code[=:]([a-f0-9-]+)/i,
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i, // UUID pattern
      /([a-f0-9]{32,})/i // Generic hex string
    ];

    for (const pattern of patterns) {
      const match = qrContent.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Format expiry time for display
   */
  formatExpiryTime(expiresAt: string): string {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec <= 0) return 'Expired';
    if (diffSec < 60) return `${diffSec}s remaining`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ${diffSec % 60}s remaining`;
    return `${Math.floor(diffSec / 3600)}h ${Math.floor((diffSec % 3600) / 60)}m remaining`;
  }

  /**
   * Validate session ID format
   */
  isValidSessionId(sessionId: string): boolean {
    if (!sessionId || sessionId.trim().length < 8) {
      return false;
    }

    // Check for common session ID patterns
    const validPatterns = [
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, // UUID
      /^[a-f0-9]{32,}$/i, // Hex string
      /^[a-zA-Z0-9_-]{16,}$/ // Base64-like string
    ];

    return validPatterns.some(pattern => pattern.test(sessionId.trim()));
  }
}

// Export singleton instance
export const qrService = new QRService();
export default qrService;
