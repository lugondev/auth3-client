// Common API response types

export interface ApiResponse<T> {
	data: T
	message?: string
	status: number
}

export interface PaginatedResponse<T> {
	items: T[]
	total: number
	limit: number
	offset: number
	total_pages: number
}

export interface ErrorResponse {
	error: string
	message: string
	status: number
	timestamp: string
}

// Success response for operations that don't return data
export interface SuccessResponse {
	message: string
	status: number
}

// Bulk operation response
export interface BulkOperationResponse {
	success_count: number
	failed_count: number
	failed_items?: Array<{
		item: unknown
		error: string
	}>
}

// Permission check response
export interface PermissionCheckResponse {
	allowed: boolean
	reason?: string
}

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