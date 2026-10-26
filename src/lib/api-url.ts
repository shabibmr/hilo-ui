/**
 * Shared helper for the Hilo API base URL.
 * Normalizes NEXT_PUBLIC_API_URL by trimming whitespace and trailing slashes,
 * and validates that the variable is defined and non-empty.
 */
export function getApiBaseUrl(): string {
  const url = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  }
  return url;
}
