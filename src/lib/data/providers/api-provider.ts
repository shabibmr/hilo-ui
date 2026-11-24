import { getApiBaseUrl } from '@/lib/api-url';
import { CommerceRepository, ContentRepository } from '../repository';
import { Cart, Collection, FounderStoryContent, HomepageContent, Product, SiteSettings } from '../types';

export { getApiBaseUrl };

function apiBase(): string {
  return `${getApiBaseUrl()}/api/v1`;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    response = await fetch(`${apiBase()}${path}`, {
      ...init,
      cache: 'no-store',
      headers,
    });
  } catch (error) {
    throw new Error(`API ${path} is unreachable: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (response.status === 404) {
    throw Object.assign(new Error('Resource not found.'), { status: 404 });
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as {
      error?: string | { message?: string };
    } | null;
    const message = typeof body?.error === 'string'
      ? body.error
      : body?.error?.message || `API ${path} failed (${response.status})`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export class ApiCommerceRepository implements CommerceRepository {
  async getProducts(filter?: {
    collectionHandle?: string;
    difficulty?: string;
    maxPrice?: number;
  }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filter?.collectionHandle) params.set('collection', filter.collectionHandle);
    if (filter?.difficulty) params.set('difficulty', filter.difficulty);
    if (filter?.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice));
    const qs = params.toString();
    return apiGet<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  }

  async getProductByHandle(handle: string): Promise<Product | null> {
    if (!handle || !handle.trim()) return null;
    try {
      return await apiGet<Product>(`/products/${encodeURIComponent(handle.trim())}`);
    } catch (error) {
      if ((error as { status?: number }).status === 404) return null;
      throw error;
    }
  }

  async getBestSellers(): Promise<Product[]> {
    return apiGet<Product[]>('/products/best-sellers');
  }

  async getCollections(): Promise<Collection[]> {
    return apiGet<Collection[]>('/collections');
  }

  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    if (!handle || !handle.trim()) return null;
    try {
      return await apiGet<Collection>(`/collections/${encodeURIComponent(handle.trim())}`);
    } catch (error) {
      if ((error as { status?: number }).status === 404) return null;
      throw error;
    }
  }

  async createCart(id?: string): Promise<Cart> {
    const result = await apiRequest<{ id: string }>('/carts', {
      method: 'POST',
      body: JSON.stringify(id ? { id } : {}),
    });
    const cart = await this.getCart(result.id);
    if (!cart) throw new Error('The cart could not be initialized.');
    return cart;
  }

  async getCart(cartId: string): Promise<Cart | null> {
    if (!cartId) return null;
    try {
      return await apiGet<Cart>(`/carts/${encodeURIComponent(cartId)}`);
    } catch (error) {
      if ((error as { status?: number }).status === 404) return null;
      throw error;
    }
  }

  /**
   * Restores a local cart only when its server-side cart has expired or is missing.
   * Existing server state always wins, preventing stale tabs from overwriting newer
   * cart mutations.
   */
  async hydrateCart(cart: Cart): Promise<Cart> {
    if (!cart?.id) return this.createCart();

    // Older storefront builds used non-UUID in-memory cart ids. Migrate those
    // persisted baskets to a new server cart instead of failing initialization.
    const isServerCartId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cart.id);
    const current = isServerCartId ? await this.getCart(cart.id) : null;
    if (current) return current;

    let restored = await this.createCart(isServerCartId ? cart.id : undefined);
    for (const line of cart.lines ?? []) {
      try {
        restored = await this.addCartLine(
          restored.id,
          line.product.id,
          line.variant.id,
          line.quantity
        );
      } catch {
        // Catalog availability or stock changed while the browser was offline.
        // Keep restoring other lines; the server remains authoritative.
      }
    }
    return restored;
  }

  async addCartLine(
    cartId: string,
    productId: string,
    variantId: string,
    quantity: number,
  ): Promise<Cart> {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error('Quantity must be a whole number between 1 and 20.');
    }
    const id = cartId || (await this.createCart()).id;
    return apiRequest<Cart>(`/carts/${encodeURIComponent(id)}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity }),
    });
  }

  async updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 20) {
      throw new Error('Quantity must be a whole number between 0 and 20.');
    }
    return apiRequest<Cart>(
      `/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(lineId)}`,
      { method: 'PATCH', body: JSON.stringify({ quantity }) }
    );
  }

  async removeCartLine(cartId: string, lineId: string): Promise<Cart> {
    return apiRequest<Cart>(
      `/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(lineId)}`,
      { method: 'DELETE' }
    );
  }
}

export class ApiContentRepository implements ContentRepository {
  async getHomepageContent(): Promise<HomepageContent> {
    return apiGet<HomepageContent>('/content/homepage');
  }

  async getFounderStory(): Promise<FounderStoryContent> {
    return apiGet<FounderStoryContent>('/content/founder');
  }

  async getSiteSettings(): Promise<SiteSettings> {
    const base = apiBase();
    let res: Response;
    try {
      res = await fetch(`${base}/settings`);
    } catch (err) {
      throw new Error(
        `API /settings is unreachable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (!res.ok) {
      throw new Error(`API /settings failed (${res.status})`);
    }
    return res.json() as Promise<SiteSettings>;
  }

  async submitEnquiry(input: {
    name: string;
    email: string;
    message: string;
    kind?: 'contact' | 'workshop';
  }): Promise<void> {
    const base = apiBase();
    let res: Response;
    try {
      res = await fetch(`${base}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch (err) {
      throw new Error(
        `API /enquiries is unreachable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (!res.ok) {
      const errBody = (await res.json().catch(() => null)) as {
        error?: string | { message?: string };
      } | null;
      const msg =
        typeof errBody?.error === 'string'
          ? errBody.error
          : errBody?.error?.message || `API /enquiries failed (${res.status})`;
      throw new Error(msg);
    }
  }
}
