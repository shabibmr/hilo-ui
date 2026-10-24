import { supabase } from '@/lib/supabase';
import { CommerceRepository, ContentRepository } from '../repository';
import {
  Cart,
  Collection,
  Difficulty,
  FounderStoryContent,
  HomepageContent,
  Product,
  SiteSettings,
} from '../types';
import { MOCK_HOMEPAGE_CONTENT } from '../mock/homepage-content';
import { MOCK_FOUNDER_STORY } from '../mock/founder';

// In-memory cart store for client-side checkout session
const supabaseCarts = new Map<string, Cart>();

function mapDbProduct(row: Record<string, unknown>): Product {
  const stock = Number(row.stock) || 0;
  const price = Number(row.price) || 0;

  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    subtitle: row.subtitle || undefined,
    description: row.description || '',
    shortDescription: row.short_description || row.description || '',
    price,
    currencyCode: row.currency_code || 'INR',
    difficulty: (row.difficulty || 'Beginner') as Difficulty,
    estimatedHours: Number(row.estimated_hours) || 0,
    images: Array.isArray(row.images) ? row.images : [],
    collections: Array.isArray(row.collections) ? row.collections : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    whatsIncluded: Array.isArray(row.whats_included) ? row.whats_included : [],
    shippingInfo: row.shipping_info || '',
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
    isBestSeller: Boolean(row.is_best_seller),
    isFeatured: Boolean(row.is_featured),
    variants: [
      {
        id: `${row.id}-default`,
        title: 'Default',
        price,
        availableForSale: stock > 0,
        sku: row.handle,
      },
    ],
  };
}

function mapDbCollection(row: Record<string, unknown>): Collection {
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description || '',
    image: row.image || {
      url: '/images/hero/hero-fairy-moon.jpg',
      altText: row.title,
    },
    featuredProductHandles: Array.isArray(row.featured_product_handles)
      ? row.featured_product_handles
      : [],
  };
}

export class SupabaseCommerceRepository implements CommerceRepository {
  async getProducts(filter?: {
    collectionHandle?: string;
    difficulty?: string;
    maxPrice?: number;
  }): Promise<Product[]> {
    let query = supabase.from('products').select('*').eq('published', true);

    if (filter?.difficulty) {
      query = query.ilike('difficulty', filter.difficulty);
    }
    if (filter?.maxPrice) {
      query = query.lte('price', filter.maxPrice);
    }

    const { data, error } = await query;
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
      .eq('published', true);

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
    if (!supabaseCarts.has(cart.id)) {
      supabaseCarts.set(cart.id, cart);
    }
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

    const { data: dbProduct, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (error || !dbProduct) {
      throw new Error(`Product not found: ${productId}`);
    }

    const product = mapDbProduct(dbProduct);
    const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];

    const existingLineIndex = cart.lines.findIndex(
      (l) => l.product.id === productId && l.variant.id === variantId
    );

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
    try {
      const settings = await this.getSiteSettings();
      if (settings?.hero) {
        return {
          ...MOCK_HOMEPAGE_CONTENT,
          hero: {
            eyebrow: settings.hero.eyebrow || MOCK_HOMEPAGE_CONTENT.hero.eyebrow,
            headline: settings.hero.headline || MOCK_HOMEPAGE_CONTENT.hero.headline,
            subheadline:
              settings.hero.subheadline || MOCK_HOMEPAGE_CONTENT.hero.subheadline,
            primaryCtaText:
              settings.hero.primaryCtaText || MOCK_HOMEPAGE_CONTENT.hero.primaryCtaText,
            primaryCtaLink:
              settings.hero.primaryCtaLink || MOCK_HOMEPAGE_CONTENT.hero.primaryCtaLink,
            secondaryCtaText:
              settings.hero.secondaryCtaText || MOCK_HOMEPAGE_CONTENT.hero.secondaryCtaText,
            secondaryCtaLink:
              settings.hero.secondaryCtaLink || MOCK_HOMEPAGE_CONTENT.hero.secondaryCtaLink,
            backgroundImage:
              settings.hero.backgroundImage || MOCK_HOMEPAGE_CONTENT.hero.backgroundImage,
          },
        };
      }
    } catch (err) {
      console.warn('Could not read site_settings from Supabase for hero, using fallback:', err);
    }

    return MOCK_HOMEPAGE_CONTENT;
  }

  async getFounderStory(): Promise<FounderStoryContent> {
    return MOCK_FOUNDER_STORY;
  }

  async getSiteSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load site settings: ${error.message}`);
    }

    if (!data) {
      return {
        id: 1,
        hero: {
          eyebrow: MOCK_HOMEPAGE_CONTENT.hero.eyebrow,
          headline: MOCK_HOMEPAGE_CONTENT.hero.headline,
          subheadline: MOCK_HOMEPAGE_CONTENT.hero.subheadline,
          primaryCtaText: MOCK_HOMEPAGE_CONTENT.hero.primaryCtaText,
          primaryCtaLink: MOCK_HOMEPAGE_CONTENT.hero.primaryCtaLink,
          secondaryCtaText: MOCK_HOMEPAGE_CONTENT.hero.secondaryCtaText,
          secondaryCtaLink: MOCK_HOMEPAGE_CONTENT.hero.secondaryCtaLink,
          backgroundImage: MOCK_HOMEPAGE_CONTENT.hero.backgroundImage,
        },
        store: {
          name: 'Hilo Arte',
          address: 'Studio 4, 18 Hill Road, Bandra West, Mumbai 400050',
          phone: '+91 22 4893 2210',
          email: 'hello@hiloarte.com',
          hours: 'Tuesday to Saturday, 11:00 to 18:00',
          gstin: '27AAPFH1842Q1Z5',
        },
        social: {
          instagram: 'https://instagram.com/hiloarte',
          pinterest: 'https://pinterest.com/hiloarte',
          whatsapp: '+91 98200 11024',
        },
        announcement: 'Complimentary Express Shipping across India on orders over ₹1499',
        updated_at: new Date().toISOString(),
      };
    }

    return {
      id: data.id || 1,
      hero: {
        eyebrow: data.hero?.eyebrow || MOCK_HOMEPAGE_CONTENT.hero.eyebrow,
        headline: data.hero?.headline || MOCK_HOMEPAGE_CONTENT.hero.headline,
        subheadline: data.hero?.subheadline || MOCK_HOMEPAGE_CONTENT.hero.subheadline,
        primaryCtaText: data.hero?.primaryCtaText || MOCK_HOMEPAGE_CONTENT.hero.primaryCtaText,
        primaryCtaLink: data.hero?.primaryCtaLink || MOCK_HOMEPAGE_CONTENT.hero.primaryCtaLink,
        secondaryCtaText:
          data.hero?.secondaryCtaText || MOCK_HOMEPAGE_CONTENT.hero.secondaryCtaText,
        secondaryCtaLink:
          data.hero?.secondaryCtaLink || MOCK_HOMEPAGE_CONTENT.hero.secondaryCtaLink,
        backgroundImage:
          data.hero?.backgroundImage || MOCK_HOMEPAGE_CONTENT.hero.backgroundImage,
      },
      store: {
        name: data.store?.name || 'Hilo Arte',
        address: data.store?.address || 'Studio 4, 18 Hill Road, Bandra West, Mumbai 400050',
        phone: data.store?.phone || '+91 22 4893 2210',
        email: data.store?.email || 'hello@hiloarte.com',
        hours: data.store?.hours || 'Tuesday to Saturday, 11:00 to 18:00',
        gstin: data.store?.gstin || '27AAPFH1842Q1Z5',
      },
      social: {
        instagram: data.social?.instagram || 'https://instagram.com/hiloarte',
        pinterest: data.social?.pinterest || 'https://pinterest.com/hiloarte',
        whatsapp: data.social?.whatsapp || '+91 98200 11024',
      },
      announcement: data.announcement ?? '',
      updated_at: data.updated_at || new Date().toISOString(),
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
