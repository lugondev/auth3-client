/**
 * Date utility functions for credential issuance
 */

/**
 * Convert a date string in YYYY-MM-DD format to RFC3339 format
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date string in RFC3339 format (ISO8601 with timezone)
 */
export function dateStringToRFC3339(dateString: string): string {
	if (!dateString) return '';

	// If already in RFC3339 format, return as is
	if (dateString.includes('T')) {
		return dateString;
	}

	// Convert YYYY-MM-DD to RFC3339 (assume start of day in UTC)
	const date = new Date(dateString + 'T00:00:00.000Z');
	return date.toISOString();
}

/**
 * Convert a Date object to RFC3339 format
 * @param date - Date object
 * @returns Date string in RFC3339 format
 */
export function dateToRFC3339(date: Date): string {
	return date.toISOString();
}

/**
 * Convert RFC3339 date string to YYYY-MM-DD format for HTML date inputs
 * @param rfc3339String - Date string in RFC3339 format
 * @returns Date string in YYYY-MM-DD format
 */
export function rfc3339ToDateString(rfc3339String: string): string {
	if (!rfc3339String) return '';

	try {
		const date = new Date(rfc3339String);
		return date.toISOString().split('T')[0];
	} catch {
		return '';
	}
}

/**
 * Get current date in YYYY-MM-DD format for HTML date inputs
 * @returns Today's date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
	return new Date().toISOString().split('T')[0];
}

/**
 * Get current date in RFC3339 format
 * @returns Current date/time in RFC3339 format
 */
export function getCurrentRFC3339(): string {
	return new Date().toISOString();
}

/**
 * Validate if a date string is in valid YYYY-MM-DD format
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateString(dateString: string): boolean {
	if (!dateString) return false;

	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(dateString)) return false;

	const date = new Date(dateString);
	return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate if a date string is in valid RFC3339 format
 * @param rfc3339String - RFC3339 string to validate
 * @returns true if valid, false otherwise
 */
export function isValidRFC3339(rfc3339String: string): boolean {
	if (!rfc3339String) return false;

	try {
		const date = new Date(rfc3339String);
		return date instanceof Date && !isNaN(date.getTime()) && rfc3339String.includes('T');
	} catch {
		return false;
	}
}
