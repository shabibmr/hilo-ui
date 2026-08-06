import { CommerceRepository, ContentRepository } from '../repository';
import { Product, Collection, Cart, HomepageContent, FounderStoryContent } from '../types';
import { MOCK_PRODUCTS } from '../mock/products';
import { MOCK_COLLECTIONS } from '../mock/collections';
import { MOCK_FOUNDER_STORY } from '../mock/founder';
import { MOCK_HOMEPAGE_CONTENT } from '../mock/homepage-content';

// In-memory cart store for mock implementation
const mockCarts = new Map<string, Cart>();

export class MockCommerceRepository implements CommerceRepository {
  async getProducts(filter?: { collectionHandle?: string; difficulty?: string; maxPrice?: number }): Promise<Product[]> {
    let products = [...MOCK_PRODUCTS];

    if (filter?.collectionHandle) {
      products = products.filter(p => p.collections.includes(filter.collectionHandle!));
    }
    if (filter?.difficulty) {
      products = products.filter(p => p.difficulty.toLowerCase() === filter.difficulty!.toLowerCase());
    }
    if (filter?.maxPrice) {
      products = products.filter(p => p.price <= filter.maxPrice!);
    }

    return products;
  }

  async getProductByHandle(handle: string): Promise<Product | null> {
    const product = MOCK_PRODUCTS.find(p => p.handle === handle);
    return product || null;
  }

  async getBestSellers(): Promise<Product[]> {
    return MOCK_PRODUCTS.filter(p => p.isBestSeller);
  }

  async getCollections(): Promise<Collection[]> {
    return MOCK_COLLECTIONS;
  }

  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    const collection = MOCK_COLLECTIONS.find(c => c.handle === handle);
    return collection || null;
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
    mockCarts.set(id, newCart);
    return newCart;
  }

  async getCart(cartId: string): Promise<Cart | null> {
    return mockCarts.get(cartId) || null;
  }

  async hydrateCart(cart: Cart): Promise<void> {
    if (!mockCarts.has(cart.id)) {
      mockCarts.set(cart.id, cart);
    }
  }

  async addCartLine(cartId: string, productId: string, variantId: string, quantity: number): Promise<Cart> {
    let cart = mockCarts.get(cartId);
    if (!cart) {
      cart = await this.createCart();
    }

    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const variant = product.variants.find(v => v.id === variantId) || product.variants[0];

    const existingLineIndex = cart.lines.findIndex(l => l.product.id === productId && l.variant.id === variantId);

    if (existingLineIndex > -1) {
      cart.lines[existingLineIndex].quantity += quantity;
    } else {
      const lineId = `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      cart.lines.push({
        id: lineId,
        product,
        variant,
        quantity,
      });
    }

    this.recalculateCart(cart);
    mockCarts.set(cart.id, cart);
    return cart;
  }

  async updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
    const cart = mockCarts.get(cartId);
    if (!cart) throw new Error('Cart not found');

    const lineIndex = cart.lines.findIndex(l => l.id === lineId);
    if (lineIndex > -1) {
      if (quantity <= 0) {
        cart.lines.splice(lineIndex, 1);
      } else {
        cart.lines[lineIndex].quantity = quantity;
      }
    }

    this.recalculateCart(cart);
    mockCarts.set(cart.id, cart);
    return cart;
  }

  async removeCartLine(cartId: string, lineId: string): Promise<Cart> {
    return this.updateCartLine(cartId, lineId, 0);
  }

  private recalculateCart(cart: Cart): void {
    cart.totalQuantity = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
    cart.subtotal = cart.lines.reduce((sum, line) => sum + (line.variant.price * line.quantity), 0);
  }
}

export class MockContentRepository implements ContentRepository {
  async getHomepageContent(): Promise<HomepageContent> {
    return MOCK_HOMEPAGE_CONTENT;
  }

  async getFounderStory(): Promise<FounderStoryContent> {
    return MOCK_FOUNDER_STORY;
  }
}
