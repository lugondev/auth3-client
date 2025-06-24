/**
 * Validation utilities for various data types
 */

export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

/**
 * UUID v4 validation pattern
 * Matches: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (where y is 8, 9, A, or B)
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates a single UUID string
 */
export function validateUUID(uuid: string): ValidationResult {
	if (!uuid || typeof uuid !== 'string') {
		return { isValid: false, error: 'UUID is required and must be a string' };
	}

	const trimmedUUID = uuid.trim();
	if (!trimmedUUID) {
		return { isValid: false, error: 'UUID cannot be empty' };
	}

	if (!UUID_PATTERN.test(trimmedUUID)) {
		return { isValid: false, error: 'Invalid UUID format. Expected format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' };
	}

	return { isValid: true };
}

/**
 * Validates an array of UUID strings
 */
export function validateUUIDs(uuids: string[]): ValidationResult {
	if (!Array.isArray(uuids)) {
		return { isValid: false, error: 'UUIDs must be provided as an array' };
	}

	if (uuids.length === 0) {
		return { isValid: false, error: 'At least one UUID is required' };
	}

	const invalidUUIDs: string[] = [];

	for (const uuid of uuids) {
		const result = validateUUID(uuid);
		if (!result.isValid) {
			invalidUUIDs.push(uuid);
		}
	}

	if (invalidUUIDs.length > 0) {
		return {
			isValid: false,
			error: `Invalid UUID${invalidUUIDs.length > 1 ? 's' : ''}: ${invalidUUIDs.join(', ')}`
		};
	}

	return { isValid: true };
}

/**
 * Sanitizes and validates a UUID array from textarea input
 */
export function sanitizeAndValidateUUIDArray(input: string): {
	uuids: string[];
	validation: ValidationResult;
} {
	// Split by newlines and commas, filter empty strings, trim whitespace
	const uuids = input
		.split(/[\n,]/)
		.map(uuid => uuid.trim())
		.filter(uuid => uuid.length > 0);

	const validation = validateUUIDs(uuids);

	return { uuids, validation };
}

/**
 * Validates JSON string
 */
export function validateJSON(jsonString: string): ValidationResult & { data?: Record<string, unknown> } {
	if (!jsonString.trim()) {
		return { isValid: true, data: {} };
	}

	try {
		const data = JSON.parse(jsonString) as Record<string, unknown>;
		return { isValid: true, data };
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : 'Invalid JSON format'
		};
	}
}

/**
 * Validates required string field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
	if (!value || typeof value !== 'string' || !value.trim()) {
		return { isValid: false, error: `${fieldName} is required` };
	}
	return { isValid: true };
}

/**
 * Validates array has minimum length
 */
export function validateMinArrayLength(array: unknown[], minLength: number, fieldName: string): ValidationResult {
	if (!Array.isArray(array)) {
		return { isValid: false, error: `${fieldName} must be an array` };
	}

	if (array.length < minLength) {
		return {
			isValid: false,
			error: `${fieldName} must have at least ${minLength} item${minLength !== 1 ? 's' : ''}`
		};
	}

	return { isValid: true };
}
