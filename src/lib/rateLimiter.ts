/**
 * Rate Limiting Utility
 * Provides client-side rate limiting for API calls to prevent abuse
 */

import { AxiosError } from "axios";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (endpoint: string, userId?: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Default rate limit configurations for different endpoint types
 */
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Permission API endpoints
  'permission-check': {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  'permission-bulk-check': {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  'permission-refresh': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Authentication endpoints
  'auth-login': {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  'auth-refresh': {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  // User management endpoints
  'user-create': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  'user-update': {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  // Default for other endpoints
  'default': {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  }
};

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize with default configs
    Object.entries(DEFAULT_CONFIGS).forEach(([key, config]) => {
      this.configs.set(key, config);
    });

    // Start cleanup interval to remove expired entries
    this.startCleanup();
  }

  /**
   * Add or update rate limit configuration
   */
  setConfig(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, config);
  }

  /**
   * Get rate limit configuration for endpoint
   */
  private getConfig(endpoint: string): RateLimitConfig {
    return this.configs.get(endpoint) || this.configs.get('default')!;
  }

  /**
   * Generate cache key for rate limiting
   */
  private generateKey(endpoint: string, userId?: string): string {
    const config = this.getConfig(endpoint);
    if (config.keyGenerator) {
      return config.keyGenerator(endpoint, userId);
    }
    return userId ? `${endpoint}:${userId}` : endpoint;
  }

  /**
   * Check if request is allowed under rate limit
   */
  checkLimit(endpoint: string, userId?: string): RateLimitResult {
    const config = this.getConfig(endpoint);
    const key = this.generateKey(endpoint, userId);
    const now = Date.now();

    let entry = this.storage.get(key);

    // If no entry exists or window has expired, create new entry
    if (!entry || now - entry.firstRequest >= config.windowMs) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      };
      this.storage.set(key, entry);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: entry.resetTime - now
      };
    }

    // Increment count
    entry.count++;
    this.storage.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for specific key
   */
  reset(endpoint: string, userId?: string): void {
    const key = this.generateKey(endpoint, userId);
    this.storage.delete(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  getStatus(endpoint: string, userId?: string): RateLimitResult {
    const config = this.getConfig(endpoint);
    const key = this.generateKey(endpoint, userId);
    const now = Date.now();

    const entry = this.storage.get(key);

    if (!entry || now - entry.firstRequest >= config.windowMs) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs
      };
    }

    const allowed = entry.count < config.maxRequests;

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : entry.resetTime - now
    };
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.storage.entries()) {
        if (now >= entry.resetTime) {
          this.storage.delete(key);
        }
      }
    }, 60 * 1000); // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.storage.clear();
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter();

/**
 * Rate limiting decorator for API functions
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  endpoint: string,
  apiFunction: T,
  getUserId?: () => string | undefined
): T {
  return (async (...args: Parameters<T>) => {
    const userId = getUserId?.();
    const result = globalRateLimiter.checkLimit(endpoint, userId);

    if (!result.allowed) {
      const error = new Error(`Rate limit exceeded for ${endpoint}. Try again in ${Math.ceil((result.retryAfter || 0) / 1000)} seconds.`) as Error & {
        rateLimitExceeded: boolean;
        retryAfter?: number;
        resetTime: number;
      };
      error.rateLimitExceeded = true;
      error.retryAfter = result.retryAfter;
      error.resetTime = result.resetTime;
      throw error;
    }

    try {
      return await apiFunction(...args);
    } catch (error) {
      // If API call fails, we might want to not count it against the rate limit
      // This depends on your specific requirements
      throw error;
    }
  }) as T;
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(endpoint: string, userId?: string) {
  const checkLimit = () => globalRateLimiter.checkLimit(endpoint, userId);
  const getStatus = () => globalRateLimiter.getStatus(endpoint, userId);
  const reset = () => globalRateLimiter.reset(endpoint, userId);

  return {
    checkLimit,
    getStatus,
    reset
  };
}

/**
 * Utility function to check if an error is a rate limit error
 */
export function isRateLimitError(error: AxiosError): boolean {
  return error && typeof error === 'object' && error !== null && 'rateLimitExceeded' in error && (error as { rateLimitExceeded: boolean }).rateLimitExceeded === true;
}

/**
 * Utility function to get retry after time from rate limit error
 */
export function getRetryAfter(error: AxiosError): number | undefined {
  return isRateLimitError(error) && typeof error === 'object' && error !== null && 'retryAfter' in error ? (error as { retryAfter?: number }).retryAfter : undefined;
}

/**
 * Export the global rate limiter instance
 */
export { globalRateLimiter as rateLimiter };

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  PERMISSION_CHECK: 'permission-check',
  PERMISSION_BULK_CHECK: 'permission-bulk-check',
  PERMISSION_REFRESH: 'permission-refresh',
  AUTH_LOGIN: 'auth-login',
  AUTH_REFRESH: 'auth-refresh',
  USER_CREATE: 'user-create',
  USER_UPDATE: 'user-update',
  DEFAULT: 'default'
} as const;

export type RateLimitEndpoint = typeof RATE_LIMIT_CONFIGS[keyof typeof RATE_LIMIT_CONFIGS];