import apiClient from '@/lib/apiClient'
import { withErrorHandling } from './errorHandlingService'

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

/**
 * Upload a file
 */
export const uploadFile = withErrorHandling(
	async (
		file: File,
		options?: UploadOptions
	): Promise<UploadResponse> => {
		const formData = new FormData();
		formData.append('file', file);

		if (options?.purpose) {
			formData.append('purpose', options.purpose);
		}
		if (options?.metadata) {
			formData.append('metadata', JSON.stringify(options.metadata));
		}

		const response = await apiClient.post<UploadResponse>(
			'/api/v1/upload',
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				onUploadProgress: options?.onProgress,
			}
		);
		return response.data;
	}
);

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = withErrorHandling(
	async (
		files: File[],
		options?: UploadOptions
	): Promise<UploadResponse[]> => {
		const uploadPromises = files.map((file) =>
			uploadFile(file, options)
		);
		return Promise.all(uploadPromises);
	}
);

/**
 * Get upload status
 */
export const getUploadStatus = withErrorHandling(
	async (uploadId: string): Promise<UploadStatus> => {
		const response = await apiClient.get<UploadStatus>(
			`/api/v1/upload/${uploadId}/status`
		);
		return response.data;
	}
);

/**
 * Delete uploaded file
 */
export const deleteUpload = withErrorHandling(
	async (uploadId: string): Promise<void> => {
		await apiClient.delete(`/api/v1/upload/${uploadId}`);
	}
);

/**
 * Upload an image file with specific validation for images
 * @param file - The image file to upload
 * @param bucket - The storage bucket (default: 'images')
 * @returns Promise with upload response
 */
export const uploadImage = async (
	file: File,
	bucket: string = 'images'
): Promise<UploadResponse> => {
	return uploadFile(file, {
		bucket,
		maxSize: 5 * 1024 * 1024, // 5MB
		allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
	})
}

/**
 * Upload an OAuth2 client logo
 * @param file - The logo image file
 * @returns Promise with upload response
 */
export const uploadOAuth2Logo = async (file: File): Promise<UploadResponse> => {
	return uploadImage(file, 'oauth2-logos')
}

/**
 * Upload a user avatar
 * @param file - The avatar image file
 * @returns Promise with upload response
 */
export const uploadAvatar = async (file: File): Promise<UploadResponse> => {
	return uploadImage(file, 'avatars')
}

export interface PresignedUrlResponse {
	url: string
	fields: Record<string, string>
}

/**
 * Get presigned URL for direct upload to cloud storage
 */
export const getPresignedUrl = withErrorHandling(
	async (
		fileName: string,
		fileType: string,
		bucket: string = 'general'
	): Promise<PresignedUrlResponse> => {
		const response = await apiClient.post<PresignedUrlResponse>('/api/v1/upload/presigned', {
			fileName,
			fileType,
			bucket,
		});

		return response.data;
	}
);