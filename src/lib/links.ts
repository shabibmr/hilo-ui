/**
 * Collection links go through the query shell so they work for any handle,
 * including ones added after the last static export and the virtual `all` listing.
 * See docs/frontend/STATIC_ROUTES.md.
 */
export function collectionHref(handle: string): string {
  return `/collections/view/?handle=${encodeURIComponent(handle)}`;
}
