import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import { getAuth } from 'firebase/auth';
import { app } from './firebase'; // Assuming firebase is initialized here

const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1', // Default to localhost:8080/api/v1
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true, // Important for CORS with credentials
});

// Add a request interceptor to include the Firebase auth token
apiClient.interceptors.request.use(
	async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
		const auth = getAuth(app);
		const user = auth.currentUser;

		if (user) {
			try {
				const idToken = await user.getIdToken();
				// Ensure headers object exists and is an instance of AxiosHeaders
				if (!config.headers) {
					config.headers = new AxiosHeaders();
				}
				// Use the set method for AxiosHeaders
				config.headers.set('Authorization', `Bearer ${idToken}`);
			} catch (error) {
				console.error('Error getting ID token:', error);
				// Handle token refresh or re-authentication if necessary
				// Depending on the error, you might want to reject the request or try refreshing the token
			}
		}
		return config;
	},
	(error: AxiosError) => {
		// Do something with request error
		return Promise.reject(error);
	}
);

// Add a response interceptor for handling errors globally (optional)
apiClient.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error: AxiosError) => {
		// Handle specific error statuses or log errors
		console.error('API call error:', error.response?.data || (error.message as string));
		// You might want to redirect to login on 401 errors, etc.
		return Promise.reject(error);
	}
);

export default apiClient;

// Define interfaces for API responses based on Go handlers (can be expanded)

// User related interfaces (based on user_handler.go and domain/auth)
export interface UserOutput {
	id: string;
	email: string;
	name?: string;
	// Add other fields from auth.UserOutput
}

export interface UserProfileOutput {
	// TODO: Define fields based on Go's auth.UserProfileOutput
	// Example:
	// bio?: string;
	// location?: string;
	[key: string]: unknown; // Allow other properties for now
}

export interface UpdateUserInput {
	name?: string;
	// Add other fields from auth.UpdateUserInput
}

export interface UpdateProfileInput {
	// TODO: Define fields based on Go's auth.UpdateProfileInput
	// Example:
	// bio?: string;
	// location?: string;
	[key: string]: unknown; // Allow other properties for now
}

export interface PaginatedUsers {
	users: UserOutput[];
	total_count: number;
	page: number;
	limit: number;
	total_pages: number;
}

export interface UserSearchQuery {
	query?: string;
	status?: string; // Consider using an enum if statuses are fixed
	role?: string;
	page?: number;
	page_size?: number;
}


// Venue related interfaces (based on venue_handler.go and domain/venue)
export interface Venue {
	id: string;
	name: string;
	description?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	// Add other fields from venue.Venue
}

export interface CreateVenueInput {
	name: string;
	description?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	// Add other fields from ports.CreateVenueInput
}

export interface UpdateVenueInput {
	name?: string;
	description?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	// Add other fields from ports.UpdateVenueInput
}

export interface PaginatedVenues {
	venues: Venue[];
	total_count: number;
	page: number;
	limit: number;
	total_pages: number;
}

export interface VenueSearchQuery {
	query?: string;
	latitude?: number;
	longitude?: number;
	radius?: number;
	category?: string;
	page?: number;
	limit?: number;
}

// Add interfaces for Venue Staff, Settings, Photos, Tables, Events, Products as needed
