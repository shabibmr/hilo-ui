import { CommerceRepository, ContentRepository } from '../repository';
import {
  Cart,
  Collection,
  FounderStoryContent,
  HomepageContent,
  Product,
  SiteSettings,
} from '../types';
import { MOCK_HOMEPAGE_CONTENT } from '../mock/homepage-content';
import { MOCK_FOUNDER_STORY } from '../mock/founder';

const apiCarts = new Map<string, Cart>();

function apiBase(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  }
  return `${base}/api/v1`;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`);
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
    const res = await fetch(`${apiBase()}/products/${encodeURIComponent(handle)}`);
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
    const res = await fetch(`${apiBase()}/collections/${encodeURIComponent(handle)}`);
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
    if (!apiCarts.has(cart.id)) {
      apiCarts.set(cart.id, cart);
    }
  }

  async addCartLine(
    cartId: string,
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<Cart> {
    let cart = apiCarts.get(cartId);
    if (!cart) {
      cart = await this.createCart();
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
    const products = await this.getProducts();
    return products.find((p) => p.id === productId) || null;
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
    const settings = await this.getSiteSettings();
    return { ...MOCK_HOMEPAGE_CONTENT, hero: settings.hero as HomepageContent['hero'] };
  }

  async getFounderStory(): Promise<FounderStoryContent> {
    return MOCK_FOUNDER_STORY;
  }

  async getSiteSettings(): Promise<SiteSettings> {
    const res = await fetch(`${apiBase()}/settings`);
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
    const res = await fetch(`${apiBase()}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`API /enquiries failed (${res.status})`);
    }
  }
}
