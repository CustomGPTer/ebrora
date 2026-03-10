import { SITE_CONFIG, VALIDATION } from './constants';

/**
 * Format a date string or Date object to a readable format
 * @param date - Date to format
 * @param format - Format style (long, short, default)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'long' | 'short' | 'default' = 'default'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : format === 'short'
        ? { year: '2-digit', month: '2-digit', day: '2-digit' }
        : { year: 'numeric', month: 'short', day: 'numeric' };

  return new Intl.DateTimeFormat('en-GB', options).format(dateObj);
}

/**
 * Format a price with currency symbol
 * @param amount - Price amount
 * @param currency - Currency code (default: GBP)
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number | string,
  currency: string = SITE_CONFIG.brand.primary
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '£0.00';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency === 'GBP' ? 'GBP' : 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: ...)
 * @returns Truncated text
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Convert text to URL-friendly slug
 * @param text - Text to slugify
 * @returns Slugified text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/**
 * Combine classNames conditionally
 * @param classes - Classes to combine
 * @returns Combined class string
 */
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes
    .filter((cls) => typeof cls === 'string' && cls.length > 0)
    .join(' ');
}

/**
 * Generate a RAMS reference number
 * Format: RAMS-XXXXXX (6 random alphanumeric characters)
 * @returns Generated reference number
 */
export function generateReferenceNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'RAMS-';

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generate a unique ID (for temporary files, etc.)
 * @returns Generated ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate an email address
 * @param email - Email to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION.email.test(email);
}

/**
 * Validate a password
 * Must contain: uppercase, lowercase, number, special character, min 8 chars
 * @param password - Password to validate
 * @returns True if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  return VALIDATION.password.test(password);
}

/**
 * Validate a URL
 * @param url - URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  return VALIDATION.url.test(url);
}

/**
 * Validate a slug
 * @param slug - Slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  return VALIDATION.slug.test(slug);
}

/**
 * Get initials from a name
 * @param name - Full name
 * @returns Two-letter initials
 */
export function getInitials(name: string): string {
  if (!name) {
    return '??';
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) {
    return '??';
  }

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Capitalize first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parse error message from various error types
 * @param error - Error object
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'An unexpected error occurred';
}

/**
 * Delay execution for a given number of milliseconds
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a value is empty (null, undefined, empty string, etc.)
 * @param value - Value to check
 * @returns True if empty, false otherwise
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Deep clone an object (for simple objects only)
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Object) {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        (cloned as any)[key] = deepClone(obj[key as keyof T]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Merge two objects
 * @param target - Target object
 * @param source - Source object
 * @returns Merged object
 */
export function merge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      (result as any)[key] = (source as any)[key];
    }
  }

  return result;
}

/**
 * Format file size to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if string contains any HTML tags
 * @param str - String to check
 * @returns True if HTML tags detected, false otherwise
 */
export function containsHtml(str: string): boolean {
  return /<[^>]*>/.test(str);
}

/**
 * Sanitize HTML (remove script tags and dangerous attributes)
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}

/**
 * Get query parameters from a URL
 * @param url - URL string
 * @returns Object with query parameters
 */
export function getQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URL(url).searchParams;

  for (const [key, value] of searchParams) {
    params[key] = value;
  }

  return params;
}

/**
 * Build query string from object
 * @param params - Parameters object
 * @returns Query string
 */
export function buildQueryString(params: Record<string, string | number | boolean>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxAttempts - Maximum attempts
 * @param delayMs - Initial delay in milliseconds
 * @returns Result from function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delayTime = delayMs * Math.pow(2, attempt - 1);
        await delay(delayTime);
      }
    }
  }

  throw lastError || new Error('Max retry attempts exceeded');
}
