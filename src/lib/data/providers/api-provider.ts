import { getApiBaseUrl } from '@/lib/api-url';
import { CommerceRepository, ContentRepository } from '../repository';
import { Cart, Collection, FounderStoryContent, HomepageContent, Product, SiteSettings } from '../types';

export { getApiBaseUrl };

const apiCarts = new Map<string, Cart>();

function apiBase(): string {
  return `${getApiBaseUrl()}/api/v1`;
}

async function apiGet<T>(path: string): Promise<T> {
  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`);
  } catch (err) {
    throw new Error(
      `API ${path} is unreachable: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (!res.ok) {
    throw new Error(`API ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
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
    const base = apiBase();
    let res: Response;
    try {
      res = await fetch(`${base}/products/${encodeURIComponent(handle.trim())}`);
    } catch (err) {
      throw new Error(
        `API /products/${handle} is unreachable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API /products/${handle} failed (${res.status})`);
    return res.json() as Promise<Product>;
  }

  async getBestSellers(): Promise<Product[]> {
    return apiGet<Product[]>('/products/best-sellers');
  }

  async getCollections(): Promise<Collection[]> {
    return apiGet<Collection[]>('/collections');
  }

  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    if (!handle || !handle.trim()) return null;
    const base = apiBase();
    let res: Response;
    try {
      res = await fetch(`${base}/collections/${encodeURIComponent(handle.trim())}`);
    } catch (err) {
      throw new Error(
        `API /collections/${handle} is unreachable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API /collections/${handle} failed (${res.status})`);
    return res.json() as Promise<Collection>;
  }

  async createCart(): Promise<Cart> {
    const id = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newCart: Cart = {
      id,
      lines: [],
      subtotal: 0,
      currencyCode: 'INR',
      totalQuantity: 0,
    };
    apiCarts.set(id, newCart);
    return newCart;
  }

  async getCart(cartId: string): Promise<Cart | null> {
    return apiCarts.get(cartId) || null;
  }

  async hydrateCart(cart: Cart): Promise<void> {
    if (!cart?.id) return;
    const existing = apiCarts.get(cart.id);
    const lines =
      Array.isArray(cart.lines) && cart.lines.length > 0
        ? cart.lines.map((l) => ({ ...l }))
        : existing?.lines
        ? [...existing.lines]
        : [];
    const hydrated: Cart = {
      id: cart.id,
      lines,
      currencyCode: cart.currencyCode || existing?.currencyCode || 'INR',
      subtotal: cart.subtotal ?? existing?.subtotal ?? 0,
      totalQuantity: cart.totalQuantity ?? existing?.totalQuantity ?? 0,
    };
    this.recalculateCart(hydrated);
    apiCarts.set(cart.id, hydrated);
  }

  async addCartLine(
    cartId: string,
    productId: string,
    variantId: string,
    quantity: number,
    existingCart?: Cart | null
  ): Promise<Cart> {
    let cart: Cart;
    if (!cartId) {
      cart = await this.createCart();
    } else {
      let found = apiCarts.get(cartId);
      if (!found) {
        const existingLines =
          existingCart && existingCart.id === cartId && Array.isArray(existingCart.lines)
            ? existingCart.lines.map((l) => ({ ...l }))
            : [];
        found = {
          id: cartId,
          lines: existingLines,
          subtotal: existingCart?.subtotal ?? 0,
          currencyCode: existingCart?.currencyCode || 'INR',
          totalQuantity: existingCart?.totalQuantity ?? 0,
        };
        this.recalculateCart(found);
        apiCarts.set(cartId, found);
      } else if (
        found.lines.length === 0 &&
        existingCart &&
        existingCart.id === cartId &&
        Array.isArray(existingCart.lines) &&
        existingCart.lines.length > 0
      ) {
        found.lines = existingCart.lines.map((l) => ({ ...l }));
        this.recalculateCart(found);
      }
      cart = found;
    }

    const product = await this.getProductById(productId);
    if (!product) throw new Error('Product not found');
    const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    if (!variant?.availableForSale) {
      throw new Error(`${product.title} is sold out.`);
    }

    const existing = cart.lines.find(
      (l) => l.product.id === productId && l.variant.id === variant.id
    );
    const wanted = (existing?.quantity ?? 0) + quantity;
    if (variant.stock !== undefined && wanted > variant.stock) {
      throw new Error(`Only ${variant.stock} of ${product.title} left in stock.`);
    }

    if (existing) {
      existing.quantity = wanted;
      existing.product = product;
      existing.variant = variant;
    } else {
      cart.lines.push({
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        product,
        variant,
        quantity,
      });
    }

    this.recalculateCart(cart);
    apiCarts.set(cart.id, cart);
    return cart;
  }

  async updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
    const cart = apiCarts.get(cartId);
    if (!cart) throw new Error('Cart not found');

    const lineIndex = cart.lines.findIndex((l) => l.id === lineId);
    if (lineIndex > -1) {
      if (quantity <= 0) {
        cart.lines.splice(lineIndex, 1);
      } else {
        const stock = cart.lines[lineIndex].variant.stock;
        if (stock !== undefined && quantity > stock) {
          throw new Error(`Only ${stock} left in stock.`);
        }
        cart.lines[lineIndex].quantity = quantity;
      }
    }

    this.recalculateCart(cart);
    apiCarts.set(cart.id, cart);
    return cart;
  }

  async removeCartLine(cartId: string, lineId: string): Promise<Cart> {
    return this.updateCartLine(cartId, lineId, 0);
  }

  private async getProductById(productId: string): Promise<Product | null> {
    if (!productId || !productId.trim()) return null;
    const base = apiBase();
    let res: Response;
    try {
      res = await fetch(`${base}/products/id/${encodeURIComponent(productId.trim())}`);
    } catch (err) {
      throw new Error(
        `API /products/id/${productId} is unreachable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API /products/id/${productId} failed (${res.status})`);
    return res.json() as Promise<Product>;
  }

  private recalculateCart(cart: Cart): void {
    cart.totalQuantity = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
    cart.subtotal = cart.lines.reduce(
      (sum, line) => sum + line.variant.price * line.quantity,
      0
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
