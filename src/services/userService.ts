import apiClient, {
	UserOutput,
	UserProfile,
	UpdateUserInput,
	UpdateProfileInput,
	UpdatePasswordInput,
	UpdatePasswordResponse, // Added based on handler
	PaginatedUsers,
	UserSearchQuery,
	UpdateUserRequest, // Added for updateUser function
} from '@/lib/apiClient';

/**
 * Fetches the currently authenticated user's basic information.
 * Corresponds to GetCurrentUser in user_handler.go
 * @returns The UserOutput data.
 */
export const getCurrentUser = async (): Promise<UserOutput> => {
	try {
		const response = await apiClient.get<UserOutput>('/api/v1/users/me'); // Added /api/v1
		return response.data;
	} catch (error) {
		console.error('Error fetching current user:', error);
		throw error;
	}
};

/**
 * Updates a user's status by their ID.
 * Corresponds to UpdateUserStatus in user_handler.go (assuming such a handler exists)
 * @param userId The ID of the user to update.
 * @param status The new status for the user (UserStatus).
 * @returns The updated UserOutput data.
 */
export const updateUserStatus = async (userId: string, status: string): Promise<UserOutput> => {
	try {
		const response = await apiClient.patch<UserOutput>(`/api/v1/users/${userId}/status`, { status });
		return response.data;
	} catch (error) {
		console.error(`Error updating user status ${userId}:`, error);
		throw error;
	}
};

/**
 * Updates a user's information by their ID.
 * Corresponds to UpdateUser in user_handler.go (assuming such a handler exists for admin)
 * @param userId The ID of the user to update.
 * @param data The data to update (UpdateUserRequest).
 * @returns The updated UserOutput data.
 */
export const updateUser = async (userId: string, data: UpdateUserRequest): Promise<UserOutput> => {
	try {
		const response = await apiClient.patch<UserOutput>(`/api/v1/users/${userId}`, data);
		return response.data;
	} catch (error) {
		console.error(`Error updating user ${userId}:`, error);
		throw error;
	}
};

/**
 * Updates the currently authenticated user's basic information.
 * Corresponds to UpdateCurrentUser in user_handler.go
 * @param data The data to update (UpdateUserInput).
 * @returns The updated UserOutput data.
 */
export const updateCurrentUser = async (data: UpdateUserInput): Promise<UserOutput> => {
	try {
		const response = await apiClient.patch<UserOutput>('/api/v1/users/me', data); // Added /api/v1
		return response.data;
	} catch (error) {
		console.error('Error updating current user:', error);
		throw error;
	}
};

/**
 * Fetches a user's profile information by their ID.
 * Corresponds to GetUserProfile in user_handler.go
 * NOTE: Backend uses /users/profile/:id
 * @param userId The ID of the user whose profile to fetch.
 * @returns The UserProfile data.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
	try {
		const response = await apiClient.get<UserProfile>(`/api/v1/users/profile/${userId}`); // Added /api/v1
		return response.data;
	} catch (error) {
		console.error(`Error fetching profile for user ${userId}:`, error);
		throw error;
	}
};


/**
 * Updates the currently authenticated user's profile information.
 * Corresponds to UpdateUserProfile in user_handler.go
 * NOTE: Backend uses PATCH /users/profile
 * @param data The data to update (UpdateProfileInput).
 * @returns The updated UserProfile data.
 */
export const updateCurrentUserProfile = async (data: UpdateProfileInput): Promise<UserProfile> => {
	try {
		// Assuming PATCH /users/profile updates the *current* user's profile
		const response = await apiClient.patch<UserProfile>('/api/v1/users/profile', data); // Added /api/v1
		return response.data;
	} catch (error) {
		console.error('Error updating current user profile:', error);
		throw error;
	}
};

/**
 * Updates the currently authenticated user's password.
 * Corresponds to UpdatePassword in user_handler.go
 * @param data The current and new password (UpdatePasswordInput).
 * @returns UpdatePasswordResponse containing a success message.
 */
export const updateCurrentUserPassword = async (data: UpdatePasswordInput): Promise<UpdatePasswordResponse> => {
	try {
		const response = await apiClient.patch<UpdatePasswordResponse>('/api/v1/users/password', data); // Added /api/v1
		console.log('Password updated successfully.');
		return response.data; // Return the success message from backend
	} catch (error) {
		console.error('Error updating password:', error);
		throw error;
	}
};

/**
 * Uploads an avatar for the currently authenticated user.
 * Corresponds to UpdateUserAvatar in user_handler.go
 * @param file The avatar image file.
 * @returns The updated UserOutput with the new avatar URL.
 */
export const updateUserAvatar = async (file: File): Promise<UserOutput> => {
	const formData = new FormData();
	formData.append('avatar', file); // Backend expects the key 'avatar'

	try {
		const response = await apiClient.post<UserOutput>('/api/v1/users/avatar', formData, { // Added /api/v1
			headers: {
				'Content-Type': 'multipart/form-data', // Important for file uploads
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error uploading avatar:', error);
		throw error;
	}
};

/**
 * Fetches a user by their ID.
 * Corresponds to GetUserByID in user_handler.go
 * @param userId The ID of the user to fetch.
 * @returns The UserOutput data.
 */
export const getUserById = async (userId: string): Promise<UserOutput> => {
	try {
		const response = await apiClient.get<UserOutput>(`/api/v1/users/${userId}`); // Added /api/v1
		return response.data;
	} catch (error) {
		console.error(`Error fetching user ${userId}:`, error);
		throw error;
	}
};

/**
 * Searches for users based on specified criteria.
 * Corresponds to SearchUsers in user_handler.go
 * @param params The search criteria (UserSearchQuery).
 * @returns PaginatedUsers results.
 */
export const searchUsers = async (params: UserSearchQuery): Promise<PaginatedUsers> => {
	try {
		const response = await apiClient.get<PaginatedUsers>('/api/v1/users/search', { params }); // Added /api/v1
		return response.data;
	} catch (error) {
		console.error('Error searching users:', error);
		throw error;
	}
};
