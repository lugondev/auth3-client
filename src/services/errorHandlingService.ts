import { ErrorResponse } from '../types';

/**
 * Standardized error handling service for all API calls
 * Provides consistent error processing and user-friendly error messages
 */
export class ApiError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly details?: unknown;

	constructor(message: string, code: string, statusCode: number, details?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.statusCode = statusCode;
		this.details = details;
	}
}

/**
 * Handles API errors and converts them to standardized ApiError instances
 * @param error - The error object from axios or other sources
 * @returns ApiError instance with standardized format
 */
export const handleApiError = (error: unknown): ApiError => {
	// Type guard to check if error has response property
	if (error && typeof error === 'object' && 'response' in error) {
		const axiosError = error as { response: { data: ErrorResponse; status: number } };
		// Server responded with error status
		const errorData: ErrorResponse = axiosError.response.data;

		// Handle new ErrorResponse schema
		if (errorData.error && typeof errorData.error === 'object') {
			return new ApiError(
				errorData.error.message || 'An error occurred',
				errorData.error.code || 'UNKNOWN_ERROR',
				errorData.error.status_code || axiosError.response.status,
				errorData
			);
		}

		// Fallback for legacy error format
		const legacyError = errorData as unknown as {
			message?: string;
			error?: string;
			code?: string;
			status_code?: number;
		};
		return new ApiError(
			(legacyError.message as string) || (legacyError.error as string) || 'An error occurred',
			(legacyError.error as string) || (legacyError.code as string) || 'UNKNOWN_ERROR',
			axiosError.response.status,
			errorData
		);
	} else if (error && typeof error === 'object' && 'request' in error) {
		// Network error
		return new ApiError(
			'Network error - please check your connection',
			'NETWORK_ERROR',
			0
		);
	} else {
		// Other error
		const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		return new ApiError(
			errorMessage,
			'UNEXPECTED_ERROR',
			0
		);
	}
}

/**
 * Wrapper function for API calls with standardized error handling
 * @param apiCall - The API call function
 * @returns Function with standardized error handling
 */
export const withErrorHandling = <TArgs extends readonly unknown[], TReturn>(
	apiCall: (...args: TArgs) => Promise<TReturn>
) => {
	return async (...args: TArgs): Promise<TReturn> => {
		try {
			return await apiCall(...args);
		} catch (error) {
			throw handleApiError(error);
		}
	};
};

/**
 * Gets user-friendly error message based on error code
 * @param error - ApiError instance
 * @returns User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: ApiError): string => {
	const errorMessages: Record<string, string> = {
		'UNAUTHORIZED': 'You need to log in to perform this action',
		'FORBIDDEN': 'You do not have permission to perform this action',
		'NOT_FOUND': 'The requested resource was not found',
		'VALIDATION_ERROR': 'Invalid input data',
		'CONFLICT': 'Data already exists or conflicts',
		'RATE_LIMITED': 'You have made too many requests, please try again later',
		'NETWORK_ERROR': 'Network connection error, please check your internet connection',
		'INTERNAL_SERVER_ERROR': 'Internal server error, please try again later',
		'SERVICE_UNAVAILABLE': 'Service temporarily unavailable',
	};

	return errorMessages[error.code] || error.message || 'An unexpected error occurred';
};

export const errorService = {
	ApiError,
	handleApiError,
	withErrorHandling,
	getUserFriendlyErrorMessage,
};
export default errorService;