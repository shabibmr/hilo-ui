import { Router, type Request, type Response } from 'express';
import { sendError, wrap } from '../http.js';
import { supabase } from '../supabase.js';

const CACHE = 'public, max-age=60';

type DbRow = Record<string, unknown>;

type ImageAsset = { url: string; altText: string; width?: number; height?: number };

const DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function mapProduct(row: DbRow) {
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
    difficulty: str(row.difficulty, 'Beginner'),
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

function mapCollection(row: DbRow) {
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

const router = Router();

router.get(
  '/products/best-sellers',
  wrap(async (_req: Request, res: Response) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_best_seller', true)
      .eq('published', true)
      .order('created_at', { ascending: true })
      .order('handle');

    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }
    res.setHeader('Cache-Control', CACHE);
    res.json((data || []).map(mapProduct));
  })
);

router.get(
  '/products/id/:id',
  wrap(async (req: Request, res: Response) => {
    const id = String(req.params.id || '').trim();
    if (!id) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Product id is required');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }
    if (!data) {
      sendError(res, 404, 'NOT_FOUND', 'Product not found', { id });
      return;
    }
    res.setHeader('Cache-Control', CACHE);
    res.json(mapProduct(data));
  })
);

router.get(
  '/products/:handle',
  wrap(async (req: Request, res: Response) => {
    const handle = String(req.params.handle || '').trim();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('handle', handle)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }
    if (!data) {
      sendError(res, 404, 'NOT_FOUND', 'Product not found', { handle });
      return;
    }
    res.setHeader('Cache-Control', CACHE);
    res.json(mapProduct(data));
  })
);

router.get(
  '/products',
  wrap(async (req: Request, res: Response) => {
    const collection =
      typeof req.query.collection === 'string' ? req.query.collection.trim() : undefined;
    const difficultyRaw =
      typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : undefined;
    const maxPriceRaw =
      typeof req.query.maxPrice === 'string' ? req.query.maxPrice.trim() : undefined;

    const fieldErrors: Record<string, string> = {};

    let difficulty: string | undefined;
    if (difficultyRaw) {
      if (!DIFFICULTIES.has(difficultyRaw)) {
        fieldErrors.difficulty = 'Must be Beginner, Intermediate, or Advanced';
      } else {
        difficulty = difficultyRaw;
      }
    }

    let maxPrice: number | undefined;
    if (maxPriceRaw !== undefined && maxPriceRaw !== '') {
      const n = Number(maxPriceRaw);
      if (!Number.isFinite(n) || n < 0) {
        fieldErrors.maxPrice = 'Must be a number greater than or equal to 0';
      } else {
        maxPrice = n;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters', { fields: fieldErrors });
      return;
    }

    let query = supabase.from('products').select('*').eq('published', true);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }
    // text[] column: filter in Postgres with @> via contains.
    if (collection && collection !== 'all') {
      query = query.contains('collections', [collection]);
    }

    const { data, error } = await query.order('created_at', { ascending: true }).order('handle');
    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }

    res.setHeader('Cache-Control', CACHE);
    res.json((data || []).map(mapProduct));
  })
);

router.get(
  '/collections/:handle',
  wrap(async (req: Request, res: Response) => {
    const handle = String(req.params.handle || '').trim();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('handle', handle)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }
    if (!data) {
      sendError(res, 404, 'NOT_FOUND', 'Collection not found', { handle });
      return;
    }
    res.setHeader('Cache-Control', CACHE);
    res.json(mapCollection(data));
  })
);

router.get(
  '/collections',
  wrap(async (_req: Request, res: Response) => {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }
    res.setHeader('Cache-Control', CACHE);
    res.json((data || []).map(mapCollection));
  })
);

export default router;
