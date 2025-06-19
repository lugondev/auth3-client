/**
 * Types for Upload Service
 */

export interface UploadResponse {
	url: string
	filename?: string
	size?: number
}

export interface UploadOptions {
	bucket?: string
	maxSize?: number // in bytes
	allowedTypes?: string[]
	purpose?: string
	metadata?: Record<string, any>
	onProgress?: (progressEvent: any) => void
}

export enum UploadStatus {
	PENDING = 'pending',
	UPLOADING = 'uploading',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled'
}

export interface PresignedUrlResponse {
	url: string
	fields: Record<string, string>
}