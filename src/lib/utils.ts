import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of a string and replaces underscores with spaces.
 * @param s The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalize(s: string | undefined | null): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}


/**
 * Formats a date string in ISO format to a more readable format
 * @param dateString The date string to format (e.g. "2025-06-18T02:18:10.468843+07:00")
 * @returns Formatted date string (e.g. "June 18, 2025 02:18")
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return '';

  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}
