/**
 * CSRF Protection Utility
 * Provides CSRF token generation and validation for permission APIs
 */

import { randomBytes, createHash } from 'crypto';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CSRFTokenData {
  token: string;
  timestamp: number;
}

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Create a hash of the CSRF token for validation
 */
export function hashCSRFToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Store CSRF token in localStorage with timestamp
 */
export function storeCSRFToken(token: string): void {
  const tokenData: CSRFTokenData = {
    token: hashCSRFToken(token),
    timestamp: Date.now()
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(CSRF_COOKIE_NAME, JSON.stringify(tokenData));
  }
}

/**
 * Retrieve and validate CSRF token from localStorage
 */
export function getStoredCSRFToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(CSRF_COOKIE_NAME);
    if (!stored) return null;

    const tokenData: CSRFTokenData = JSON.parse(stored);

    // Check if token is expired
    if (Date.now() - tokenData.timestamp > CSRF_TOKEN_EXPIRY) {
      localStorage.removeItem(CSRF_COOKIE_NAME);
      return null;
    }

    return tokenData.token;
  } catch (error) {
    console.error('Error retrieving CSRF token:', error);
    localStorage.removeItem(CSRF_COOKIE_NAME);
    return null;
  }
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(providedToken: string): boolean {
  const storedToken = getStoredCSRFToken();
  if (!storedToken || !providedToken) {
    return false;
  }

  return hashCSRFToken(providedToken) === storedToken;
}

/**
 * Get or generate CSRF token for API requests
 */
export function getCSRFToken(): string {
  const storedHash = getStoredCSRFToken();

  if (!storedHash) {
    // Generate new token if none exists or expired
    const newToken = generateCSRFToken();
    storeCSRFToken(newToken);
    return newToken;
  }

  // For existing token, we need to generate a new one since we only store the hash
  // In a real implementation, you'd want to store the actual token securely
  const newToken = generateCSRFToken();
  storeCSRFToken(newToken);
  return newToken;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token
  };
}

/**
 * CSRF protection hook for React components
 */
export function useCSRFProtection() {
  const getToken = () => getCSRFToken();
  const addHeaders = (headers?: Record<string, string>) => addCSRFHeader(headers);

  return {
    getToken,
    addHeaders,
    headerName: CSRF_HEADER_NAME
  };
}

/**
 * Middleware function to add CSRF protection to API calls
 */
export function withCSRFProtection<T extends (...args: unknown[]) => Promise<unknown>>(
  apiFunction: T
): T {
  return (async (...args: Parameters<T>) => {
    // Add CSRF token to the request if it's a mutation (POST, PUT, DELETE, PATCH)
    const [url, options = {}] = args;
    const method = (options as { method?: string }).method?.toUpperCase();

    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const typedOptions = options as { method?: string; headers?: Record<string, string> };
      const headers = addCSRFHeader(typedOptions.headers || {});
      const newOptions = {
        ...typedOptions,
        headers
      };

      return apiFunction(url, newOptions, ...args.slice(2));
    }

    return apiFunction(...args);
  }) as T;
}

export { CSRF_HEADER_NAME, CSRF_COOKIE_NAME };