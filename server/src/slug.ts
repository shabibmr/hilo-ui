export const HANDLE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}

/**
 * Ensure create payloads have a valid handle.
 * Missing handle is derived from title; empty/invalid handle is rejected.
 */
export function requireHandle(
  body: Record<string, unknown>,
  titleField = 'title'
): Record<string, unknown> {
  const out = { ...body };
  let handle = typeof out.handle === 'string' ? out.handle.trim() : '';
  if (!handle && typeof out[titleField] === 'string') {
    handle = slugify(String(out[titleField]));
  }
  if (!handle) {
    throw new Error('handle is required (or provide a title to derive one)');
  }
  if (!isValidHandle(handle)) {
    throw new Error('handle must be lowercase letters, digits, and single hyphens');
  }
  out.handle = handle;
  return out;
}

/**
 * On update: if handle is present, trim and validate; otherwise leave it alone.
 */
export function normalizeHandleOnUpdate(body: Record<string, unknown>): Record<string, unknown> {
  if (!('handle' in body)) return body;
  const out = { ...body };
  const handle = typeof out.handle === 'string' ? out.handle.trim() : '';
  if (!handle || !isValidHandle(handle)) {
    throw new Error('handle must be lowercase letters, digits, and single hyphens');
  }
  out.handle = handle;
  return out;
}
