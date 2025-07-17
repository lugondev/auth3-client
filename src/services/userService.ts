import apiClient from '@/lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import { userProfileCache } from '@/lib/user-profile-cache';
import { contextManager } from '@/lib/context-manager';
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
 * Uses cache to prevent API spam.
 */
export const getCurrentUser = withErrorHandling(
	async (): Promise<UserOutput> => {
		// Get current context for cache key
		const currentMode = contextManager.getCurrentMode();

		// Try to get user ID from some source (you might need to adjust this)
		// For now, we'll use a simple cache key based on context mode
		const cacheKey = 'current-user';

		// Check cache first
		const cachedUser = userProfileCache.get(cacheKey, currentMode);
		if (cachedUser) {
			console.log('📋 Using cached user profile data');
			return cachedUser;
		}

		console.log('🔄 Fetching fresh user profile from API');
		const response = await apiClient.get<UserOutput>('/api/v1/users/me');

		// Cache the result
		userProfileCache.set(cacheKey, currentMode, response.data);

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

		// Invalidate cache after update
		const currentMode = contextManager.getCurrentMode();
		userProfileCache.clear('current-user', currentMode);

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

		// Invalidate cache after update
		const currentMode = contextManager.getCurrentMode();
		userProfileCache.clear('current-user', currentMode);

		return response.data;
	}
);

/**
 * Updates the currently authenticated user's password.
 */
export const updateCurrentUserPassword = withErrorHandling(
	async (data: UpdatePasswordInput): Promise<UpdatePasswordResponse> => {
		const response = await apiClient.patch<UpdatePasswordResponse>('/api/v1/users/password', data);

		// Note: Password update doesn't change profile data, so no cache invalidation needed
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

		// Invalidate cache after avatar update
		const currentMode = contextManager.getCurrentMode();
		userProfileCache.clear('current-user', currentMode);

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
