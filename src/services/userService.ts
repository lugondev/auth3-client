import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import {
	UserOutput,
	UserProfile,
	UpdateUserInput,
	UpdateProfileInput,
	UpdatePasswordInput,
	UpdatePasswordResponse, // Added based on handler
	PaginatedUsers,
	UserSearchQuery,
	UpdateUserRequest, // Added for updateUser function
} from '@/types/user';

/**
 * Fetches the currently authenticated user's basic information.
 */
export const getCurrentUser = withErrorHandling(
	async (): Promise<UserOutput> => {
		const response = await apiClient.get<UserOutput>('/api/v1/users/me');
		return response.data;
	}
);

/**
 * Updates a user's status by their ID.
 */
export const updateUserStatus = withErrorHandling(
	async (userId: string, status: string): Promise<UserOutput> => {
		const response = await apiClient.patch<UserOutput>(`/api/v1/users/${userId}/status`, { status });
		return response.data;
	}
);

/**
 * Updates a user's information by their ID.
 */
export const updateUser = withErrorHandling(
	async (userId: string, data: UpdateUserRequest): Promise<UserOutput> => {
		const response = await apiClient.patch<UserOutput>(`/api/v1/users/${userId}`, data);
		return response.data;
	}
);

/**
 * Updates the currently authenticated user's basic information.
 */
export const updateCurrentUser = withErrorHandling(
	async (data: UpdateUserInput): Promise<UserOutput> => {
		const response = await apiClient.patch<UserOutput>('/api/v1/users/me', data);
		return response.data;
	}
);

/**
 * Fetches a user's profile information by their ID.
 */
export const getUserProfile = withErrorHandling(
	async (userId: string): Promise<UserProfile> => {
		const response = await apiClient.get<UserProfile>(`/api/v1/users/profile/${userId}`);
		return response.data;
	}
);


/**
 * Updates the currently authenticated user's profile information.
 */
export const updateCurrentUserProfile = withErrorHandling(
	async (data: UpdateProfileInput): Promise<UserProfile> => {
		const response = await apiClient.patch<UserProfile>('/api/v1/users/profile', data);
		return response.data;
	}
);

/**
 * Updates the currently authenticated user's password.
 */
export const updateCurrentUserPassword = withErrorHandling(
	async (data: UpdatePasswordInput): Promise<UpdatePasswordResponse> => {
		const response = await apiClient.patch<UpdatePasswordResponse>('/api/v1/users/password', data);
		return response.data;
	}
);

/**
 * Uploads an avatar for the currently authenticated user.
 */
export const updateUserAvatar = withErrorHandling(
	async (file: File): Promise<UserOutput> => {
		const formData = new FormData();
		formData.append('avatar', file);

		const response = await apiClient.post<UserOutput>('/api/v1/users/avatar', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	}
);

/**
 * Fetches a user by their ID.
 */
export const getUserById = withErrorHandling(
	async (userId: string): Promise<UserOutput> => {
		const response = await apiClient.get<UserOutput>(`/api/v1/users/${userId}`);
		return response.data;
	}
);

/**
 * Searches for users based on specified criteria.
 */
export const searchUsers = withErrorHandling(
	async (params: UserSearchQuery): Promise<PaginatedUsers> => {
		const response = await apiClient.get<PaginatedUsers>('/api/v1/users/search', { params });
		return response.data;
	}
);
