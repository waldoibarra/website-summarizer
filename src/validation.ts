import { ValidationError } from './errors.js';

/**
 * Check if a string is a valid URL
 * @param urlString - The string to validate
 * @returns true if the string is a valid HTTP or HTTPS URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a URL string and return it if valid
 * @param urlString - The string to validate
 * @returns The validated URL string
 * @throws ValidationError if the URL is invalid
 */
export function validateUrl(urlString: string): string {
  if (!isValidUrl(urlString)) {
    throw new ValidationError('Invalid URL. Please provide a valid website address (e.g., https://example.com).');
  }
  return urlString;
}
