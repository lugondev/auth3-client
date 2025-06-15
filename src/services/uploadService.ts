import apiClient from '@/lib/apiClient'

export interface UploadResponse {
	url: string
	filename?: string
	size?: number
}

export interface UploadOptions {
	bucket?: string
	maxSize?: number // in bytes
	allowedTypes?: string[]
}

/**
 * Upload a file to the server
 * @param file - The file to upload
 * @param options - Upload options including bucket, max size, and allowed types
 * @returns Promise with upload response containing the file URL
 */
export const uploadFile = async (
	file: File,
	options: UploadOptions = {}
): Promise<UploadResponse> => {
	const {
		bucket = 'general',
		maxSize = 5 * 1024 * 1024, // 5MB default
		allowedTypes = ['image/*']
	} = options

	// Validate file type
	if (allowedTypes.length > 0) {
		const isAllowed = allowedTypes.some(type => {
			if (type.endsWith('/*')) {
				const baseType = type.slice(0, -2)
				return file.type.startsWith(baseType)
			}
			return file.type === type
		})

		if (!isAllowed) {
			throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
		}
	}

	// Validate file size
	if (file.size > maxSize) {
		const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
		throw new Error(`File size must be less than ${maxSizeMB}MB`)
	}

	// Create FormData for file upload
	const formData = new FormData()
	formData.append('file', file)

	try {
		const response = await apiClient.post<UploadResponse>('/api/v1/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			params: {
				bucket,
			},
		})

		return response.data
	} catch (error) {
		console.error('Upload failed:', error)
		throw error
	}
}

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