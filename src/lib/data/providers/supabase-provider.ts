import { supabase } from '@/lib/supabase';
import { CommerceRepository, ContentRepository } from '../repository';
import {
  Cart,
  Collection,
  Difficulty,
  FounderStoryContent,
  HomepageContent,
  ImageAsset,
  Product,
  SiteSettings,
} from '../types';
import { MOCK_HOMEPAGE_CONTENT } from '../mock/homepage-content';
import { MOCK_FOUNDER_STORY } from '../mock/founder';

// In-memory cart store for client-side checkout session
const supabaseCarts = new Map<string, Cart>();

type DbRow = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function mapDbProduct(row: DbRow): Product {
  const stock = Number(row.stock) || 0;
  const price = Number(row.price) || 0;
  const handle = str(row.handle);

  return {
    id: str(row.id),
    handle,
    title: str(row.title),
    subtitle: str(row.subtitle) || undefined,
    description: str(row.description),
    shortDescription: str(row.short_description) || str(row.description),
    price,
    currencyCode: str(row.currency_code, 'INR'),
    difficulty: str(row.difficulty, 'Beginner') as Difficulty,
    estimatedHours: Number(row.estimated_hours) || 0,
    images: list<ImageAsset>(row.images),
    collections: list<string>(row.collections),
    tags: list<string>(row.tags),
    whatsIncluded: list<string>(row.whats_included),
    shippingInfo: str(row.shipping_info),
    faqs: list<{ question: string; answer: string }>(row.faqs),
    isBestSeller: Boolean(row.is_best_seller),
    isFeatured: Boolean(row.is_featured),
    variants: [
      {
        id: `${row.id}-default`,
        title: 'Default',
        price,
        availableForSale: stock > 0,
        stock,
        sku: handle,
      },
    ],
  };
}

function mapDbCollection(row: DbRow): Collection {
  const image = row.image as ImageAsset | null;
  return {
    id: str(row.id),
    handle: str(row.handle),
    title: str(row.title),
    description: str(row.description),
    image: image?.url
      ? image
      : { url: '/images/hero/hero-fairy-moon.jpg', altText: str(row.title) },
    featuredProductHandles: list<string>(row.featured_product_handles),
  };
}

// ilike treats % and _ as wildcards; difficulty is a fixed enum so match it literally.
const escapeLike = (v: string) => v.replace(/[\\%_]/g, (c) => `\\${c}`);

export class SupabaseCommerceRepository implements CommerceRepository {
  async getProducts(filter?: {
    collectionHandle?: string;
    difficulty?: string;
    maxPrice?: number;
  }): Promise<Product[]> {
    let query = supabase.from('products').select('*').eq('published', true);

    if (filter?.difficulty) {
      query = query.ilike('difficulty', escapeLike(filter.difficulty));
    }
    if (filter?.maxPrice !== undefined && filter.maxPrice >= 0) {
      query = query.lte('price', filter.maxPrice);
    }

    const { data, error } = await query.order('created_at', { ascending: true }).order('handle');
    if (error) {
      throw new Error(`Failed to load products from Supabase: ${error.message}`);
    }

    let products = (data || []).map(mapDbProduct);

    if (filter?.collectionHandle && filter.collectionHandle !== 'all') {
      products = products.filter((p) => p.collections.includes(filter.collectionHandle!));
    }

    return products;
  }

  async getProductByHandle(handle: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('handle', handle)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product "${handle}": ${error.message}`);
    }
    if (!data) return null;
    return mapDbProduct(data);
  }

  async getBestSellers(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_best_seller', true)
      .eq('published', true)
      .order('created_at', { ascending: true })
      .order('handle');

    if (error) {
      throw new Error(`Failed to load best sellers: ${error.message}`);
    }
    return (data || []).map(mapDbProduct);
  }

  async getCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to load collections: ${error.message}`);
    }
    return (data || []).map(mapDbCollection);
  }

  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('handle', handle)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load collection "${handle}": ${error.message}`);
    }
    if (!data) return null;
    return mapDbCollection(data);
  }

  // Client-side cart reconciliation
  async createCart(): Promise<Cart> {
    const id = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newCart: Cart = {
      id,
      lines: [],
      subtotal: 0,
      currencyCode: 'INR',
      totalQuantity: 0,
    };
    supabaseCarts.set(id, newCart);
    return newCart;
  }

  async getCart(cartId: string): Promise<Cart | null> {
    return supabaseCarts.get(cartId) || null;
  }

  async hydrateCart(cart: Cart): Promise<void> {
    // Re-price against the live catalogue so a stale localStorage basket never
    // shows old prices, stock or unpublished products.
    const ids = [...new Set(cart.lines.map((l) => l.product.id))];
    if (ids.length === 0) {
      supabaseCarts.set(cart.id, cart);
      return;
    }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .eq('published', true);
    if (error) {
      throw new Error(`Failed to refresh basket: ${error.message}`);
    }
    const live = new Map((data || []).map((r) => [str(r.id), mapDbProduct(r)]));
    const lines = cart.lines.flatMap((line) => {
      const product = live.get(line.product.id);
      if (!product) return [];
      const variant = product.variants[0];
      const quantity =
        variant.stock !== undefined ? Math.min(line.quantity, variant.stock) : line.quantity;
      return quantity > 0 ? [{ ...line, product, variant, quantity }] : [];
    });
    const refreshed: Cart = { ...cart, lines };
    this.recalculateCart(refreshed);
    supabaseCarts.set(cart.id, refreshed);
  }

  async addCartLine(
    cartId: string,
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<Cart> {
    let cart = supabaseCarts.get(cartId);
    if (!cart) {
      cart = await this.createCart();
    }

    const qty = Math.floor(quantity);
    if (!(qty > 0)) throw new Error('Quantity must be at least 1.');

    const { data: dbProduct, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('published', true)
      .maybeSingle();

    if (error || !dbProduct) {
      throw new Error(`Product not found: ${productId}`);
    }

    const product = mapDbProduct(dbProduct);
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error('This option is no longer available.');
    }
    if (!variant.availableForSale) {
      throw new Error(`${product.title} is sold out.`);
    }

    const existing = cart.lines.find(
      (l) => l.product.id === productId && l.variant.id === variant.id
    );
    const wanted = (existing?.quantity ?? 0) + qty;
    if (variant.stock !== undefined && wanted > variant.stock) {
      throw new Error(`Only ${variant.stock} of ${product.title} left in stock.`);
    }

    if (existing) {
      existing.quantity = wanted;
      existing.product = product;
      existing.variant = variant;
    } else {
      const lineId = `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      cart.lines.push({ id: lineId, product, variant, quantity: qty });
    }

    this.recalculateCart(cart);
    supabaseCarts.set(cart.id, cart);
    return cart;
  }

  async updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
    const cart = supabaseCarts.get(cartId);
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
    supabaseCarts.set(cart.id, cart);
    return cart;
  }

  async removeCartLine(cartId: string, lineId: string): Promise<Cart> {
    return this.updateCartLine(cartId, lineId, 0);
  }

  private recalculateCart(cart: Cart): void {
    cart.totalQuantity = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
    cart.subtotal = cart.lines.reduce(
      (sum, line) => sum + line.variant.price * line.quantity,
      0
    );
  }
}

export class SupabaseContentRepository implements ContentRepository {
  async getHomepageContent(): Promise<HomepageContent> {
    // Errors propagate so the page shows a retry state instead of mock content.
    const settings = await this.getSiteSettings();
    return { ...MOCK_HOMEPAGE_CONTENT, hero: settings.hero as HomepageContent['hero'] };
  }

  async getFounderStory(): Promise<FounderStoryContent> {
    return MOCK_FOUNDER_STORY;
  }

  // Business details (address, GSTIN, contact) come only from the admin-managed row.
  // Missing values stay empty and the UI hides them; nothing is invented here.
  async getSiteSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load site settings: ${error.message}`);
    }

    const hero = MOCK_HOMEPAGE_CONTENT.hero;
    return {
      id: data?.id || 1,
      hero: {
        eyebrow: data?.hero?.eyebrow || hero.eyebrow,
        headline: data?.hero?.headline || hero.headline,
        subheadline: data?.hero?.subheadline || hero.subheadline,
        primaryCtaText: data?.hero?.primaryCtaText || hero.primaryCtaText,
        primaryCtaLink: data?.hero?.primaryCtaLink || hero.primaryCtaLink,
        secondaryCtaText: data?.hero?.secondaryCtaText || hero.secondaryCtaText,
        secondaryCtaLink: data?.hero?.secondaryCtaLink || hero.secondaryCtaLink,
        backgroundImage: data?.hero?.backgroundImage || hero.backgroundImage,
      },
      store: {
        name: data?.store?.name || '',
        address: data?.store?.address || '',
        phone: data?.store?.phone || '',
        email: data?.store?.email || '',
        hours: data?.store?.hours || '',
        gstin: data?.store?.gstin || '',
      },
      social: {
        instagram: data?.social?.instagram || '',
        pinterest: data?.social?.pinterest || '',
        whatsapp: data?.social?.whatsapp || '',
      },
      announcement: data?.announcement ?? '',
      updated_at: data?.updated_at || new Date().toISOString(),
    };
  }

  async submitEnquiry(input: {
    name: string;
    email: string;
    message: string;
    kind?: 'contact' | 'workshop';
  }): Promise<void> {
    const { error } = await supabase.from('enquiries').insert([
      {
        name: input.name,
        email: input.email,
        message: input.message,
        kind: input.kind || 'contact',
        handled: false,
      },
    ]);

    if (error) {
      throw new Error(`Failed to submit enquiry: ${error.message}`);
    }
  }
}
