/**
 * Verification Cache Service - Manage caching of verification results
 */

import { EnhancedVerificationResponse } from '@/types/presentations';

// Cache item structure
interface CacheItem<T> {
	data: T;
	expiresAt: number;
}

// Cache configuration
interface CacheConfig {
	// Default TTL in milliseconds (30 minutes)
	defaultTTL: number;
	// Maximum number of items in cache
	maxItems: number;
}

export class VerificationCacheService {
	private cache: Map<string, CacheItem<EnhancedVerificationResponse>> = new Map();
	private config: CacheConfig = {
		defaultTTL: 30 * 60 * 1000, // 30 minutes
		maxItems: 100
	};

	/**
	 * Get verification result from cache
	 * @param key - Cache key (typically presentationId or hash)
	 * @returns Cached verification result or null if not found or expired
	 */
	get(key: string): EnhancedVerificationResponse | null {
		const item = this.cache.get(key);

		// Check if item exists and not expired
		if (item && Date.now() < item.expiresAt) {
			return item.data;
		}

		// Item doesn't exist or is expired, remove it from cache
		if (item) {
			this.cache.delete(key);
		}

		return null;
	}

	/**
	 * Store verification result in cache
	 * @param key - Cache key (typically presentationId or hash)
	 * @param data - Verification result data to store
	 * @param ttl - Optional TTL in milliseconds (defaults to config value)
	 */
	set(key: string, data: EnhancedVerificationResponse, ttl?: number): void {
		// Enforce maximum cache size by removing oldest items
		if (this.cache.size >= this.config.maxItems) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) {
				this.cache.delete(oldestKey);
			}
		}

		// Calculate expiration time
		const expiresAt = Date.now() + (ttl || this.config.defaultTTL);

		// Store item in cache
		this.cache.set(key, { data, expiresAt });
	}

	/**
	 * Remove item from cache
	 * @param key - Cache key to remove
	 */
	remove(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Clear all items from cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get all valid (non-expired) cache keys
	 * @returns Array of valid cache keys
	 */
	getKeys(): string[] {
		const now = Date.now();
		const keys: string[] = [];

		this.cache.forEach((item, key) => {
			if (now < item.expiresAt) {
				keys.push(key);
			}
		});

		return keys;
	}

	/**
	 * Get cache statistics
	 * @returns Cache statistics
	 */
	getStats(): { size: number; maxSize: number; validItems: number } {
		const now = Date.now();
		let validItems = 0;

		this.cache.forEach(item => {
			if (now < item.expiresAt) {
				validItems++;
			}
		});

		return {
			size: this.cache.size,
			maxSize: this.config.maxItems,
			validItems
		};
	}

	/**
	 * Create a cache key from verification parameters
	 * @param presentationId - Presentation ID
	 * @param options - Verification options that affect the result
	 * @returns Cache key
	 */
	createCacheKey(presentationId: string, options?: Record<string, unknown>): string {
		if (!options) {
			return presentationId;
		}

		// Create a hash from the options to include in the key
		const optionsStr = JSON.stringify(options);
		return `${presentationId}-${this.hashString(optionsStr)}`;
	}

	/**
	 * Simple string hashing function
	 * @param str - String to hash
	 * @returns Hash value as string
	 */
	private hashString(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash &= hash; // Convert to 32bit integer
		}
		return hash.toString(16); // Convert to hex
	}
}

// Create singleton instance
const verificationCache = new VerificationCacheService();

export default verificationCache;
