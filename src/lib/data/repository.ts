import { Product, Collection, Cart, HomepageContent, FounderStoryContent } from './types';

export interface CommerceRepository {
  getProducts(filter?: { collectionHandle?: string; difficulty?: string; maxPrice?: number }): Promise<Product[]>;
  getProductByHandle(handle: string): Promise<Product | null>;
  getBestSellers(): Promise<Product[]>;
  getCollections(): Promise<Collection[]>;
  getCollectionByHandle(handle: string): Promise<Collection | null>;
  createCart(): Promise<Cart>;
  getCart(cartId: string): Promise<Cart | null>;
  /**
   * Reconciles backend cart state with a client-persisted cart before mutating it.
   * The mock provider's in-memory store doesn't survive a page reload, while the
   * client (localStorage via Zustand) does — this call reseeds the backend record
   * so line items aren't lost. A real Shopify provider would use the equivalent of
   * this for cart-merge/associate-on-load rather than a no-op.
   */
  hydrateCart(cart: Cart): Promise<void>;
  addCartLine(cartId: string, productId: string, variantId: string, quantity: number): Promise<Cart>;
  updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart>;
  removeCartLine(cartId: string, lineId: string): Promise<Cart>;
}

export interface ContentRepository {
  getHomepageContent(): Promise<HomepageContent>;
  getFounderStory(): Promise<FounderStoryContent>;
}
