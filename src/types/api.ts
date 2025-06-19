// Common API response types

// Import types for runtime usage
import type { PaginatedResponse, BasePagination, LegacyPaginatedResponse } from './generics';

// Re-export generic types with backward compatibility
export type { BaseApiResponse as ApiResponse } from './generics';
export type { PaginatedResponse, BasePagination, LegacyPaginatedResponse } from './generics';

// Offset-based pagination for legacy APIs
export interface OffsetPaginatedResponse<T> {
	items: T[]
	total: number
	limit: number
	offset: number
	total_pages: number
}

// Pagination utilities
export const PaginationUtils = {
	// Calculate pagination metadata
	calculatePagination: (page: number, pageSize: number, total: number): BasePagination => {
		const totalPages = Math.ceil(total / pageSize)
		return {
			current_page: page,
			page_size: pageSize,
			total_items: total,
			total_pages: totalPages,
			has_previous: page > 1,
			has_next: page < totalPages
		}
	},

	// Convert offset-based to page-based pagination
	offsetToPage: (offset: number, limit: number): number => {
		return Math.floor(offset / limit) + 1
	},

	// Convert page-based to offset-based pagination
	pageToOffset: (page: number, pageSize: number): number => {
		return (page - 1) * pageSize
	},

	// Create paginated response from legacy format
	fromLegacy: <T>(legacy: LegacyPaginatedResponse<T>): PaginatedResponse<T> => {
		const pagination = PaginationUtils.calculatePagination(legacy.page, legacy.page_size, legacy.total)
		return {
			items: legacy.items,
			pagination
		}
	}
}

// Error response matching backend schema
export interface ErrorResponse {
	error: {
		code: string
		message: string
		status_code: number
	}
}

// Re-export generic error type
export type { BaseError } from './generics';

// Error codes constants
export const ERROR_CODES = {
	// Authentication errors
	UNAUTHORIZED: 'UNAUTHORIZED',
	INVALID_TOKEN: 'INVALID_TOKEN',
	TOKEN_EXPIRED: 'TOKEN_EXPIRED',
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

	// Authorization errors
	FORBIDDEN: 'FORBIDDEN',
	INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

	// Validation errors
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	INVALID_INPUT: 'INVALID_INPUT',
	REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',

	// Resource errors
	NOT_FOUND: 'NOT_FOUND',
	RESOURCE_EXISTS: 'RESOURCE_EXISTS',
	RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

	// Server errors
	INTERNAL_ERROR: 'INTERNAL_ERROR',
	SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
	DATABASE_ERROR: 'DATABASE_ERROR',

	// Rate limiting
	RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

	// Tenant errors
	TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
	TENANT_SUSPENDED: 'TENANT_SUSPENDED',

	// User errors
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	USER_SUSPENDED: 'USER_SUSPENDED',
	EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

	// DID errors
	DID_NOT_FOUND: 'DID_NOT_FOUND',
	DID_INVALID: 'DID_INVALID',
	DID_RESOLUTION_FAILED: 'DID_RESOLUTION_FAILED'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Success response for operations that don't return data
export interface SuccessResponse {
	message: string
	status: number
}

// Re-export generic bulk operation response
export type { BulkOperationResponse } from './generics';

// Health check response
export interface HealthCheckResponse {
	status: 'healthy' | 'unhealthy'
	timestamp: string
	version: string
	services: Record<string, {
		status: 'up' | 'down'
		response_time?: number
	}>
}