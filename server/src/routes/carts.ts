import { Router, type Request, type Response } from 'express';
import { sendError, wrap } from '../http.js';
import { supabase } from '../supabase.js';

const router = Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_QUANTITY = 20;

type DbRow = Record<string, any>;

function mapProduct(row: DbRow) {
  const stock = Math.max(0, Number(row.stock) || 0);
  const price = Number(row.price) || 0;
  const id = String(row.id);
  return {
    id,
    handle: String(row.handle ?? ''),
    title: String(row.title ?? ''),
    subtitle: row.subtitle ?? undefined,
    description: String(row.description ?? ''),
    shortDescription: String(row.short_description || row.description || ''),
    price,
    currencyCode: String(row.currency_code || 'INR'),
    difficulty: String(row.difficulty || 'Beginner'),
    estimatedHours: Number(row.estimated_hours) || 0,
    images: Array.isArray(row.images) ? row.images : [],
    collections: Array.isArray(row.collections) ? row.collections : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    whatsIncluded: Array.isArray(row.whats_included) ? row.whats_included : [],
    shippingInfo: String(row.shipping_info || ''),
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
    isBestSeller: Boolean(row.is_best_seller),
    isFeatured: Boolean(row.is_featured),
    variants: [{
      id: `${id}-default`,
      title: 'Default',
      price,
      availableForSale: Boolean(row.published) && stock > 0,
      stock,
      sku: String(row.handle ?? ''),
    }],
  };
}

async function loadCart(cartId: string) {
  const { data, error } = await supabase
    .from('carts')
    .select('id, currency_code, expires_at, items:cart_items(id, product_id, variant_id, quantity, product:products(*))')
    .eq('id', cartId)
    .maybeSingle();

  if (error) throw error;
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) return null;

  const lines = (data.items ?? [])
    .filter((item: DbRow) => item.product)
    .map((item: DbRow) => {
      const product = mapProduct(item.product);
      const variant = product.variants.find((entry: DbRow) => entry.id === item.variant_id);
      return {
        id: String(item.id),
        product,
        variant: variant ?? product.variants[0],
        quantity: Number(item.quantity),
      };
    });

  const currencies = [...new Set(lines.map((line: DbRow) => line.product.currencyCode))];
  const currencyCode = currencies.length === 1 ? currencies[0] : String(data.currency_code || 'INR');
  const subtotal = lines.reduce((sum: number, line: DbRow) => sum + line.variant.price * line.quantity, 0);
  const totalQuantity = lines.reduce((sum: number, line: DbRow) => sum + line.quantity, 0);

  return { id: String(data.id), lines, subtotal, currencyCode, totalQuantity };
}

function validCartId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

router.post('/', wrap(async (req: Request, res: Response) => {
  const requestedId = req.body?.id;
  if (requestedId !== undefined && !validCartId(requestedId)) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Cart id must be a valid UUID.');
    return;
  }

  let query = supabase.from('carts').insert(requestedId ? { id: requestedId } : {}).select('id').single();
  let { data, error } = await query;

  if (error && requestedId) {
    // A restored browser cart may already exist. Reuse it; if expired, reset its lines.
    const existing = await supabase.from('carts').select('id, expires_at').eq('id', requestedId).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) throw error;

    if (new Date(existing.data.expires_at).getTime() <= Date.now()) {
      const removed = await supabase.from('cart_items').delete().eq('cart_id', requestedId);
      if (removed.error) throw removed.error;
      const renewed = await supabase.from('carts')
        .update({ expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() })
        .eq('id', requestedId).select('id').single();
      if (renewed.error) throw renewed.error;
      data = renewed.data;
    } else {
      data = existing.data;
    }
  } else if (error) {
    throw error;
  }

  if (!data) {
    sendError(res, 500, 'CART_CREATE_FAILED', 'Unable to create cart.');
    return;
  }
  res.status(201).json({ id: data.id });
}));

router.get('/:cartId', wrap(async (req: Request, res: Response) => {
  const cartId = req.params.cartId;
  if (!validCartId(cartId)) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid cart id.');
    return;
  }
  const cart = await loadCart(cartId);
  if (!cart) {
    sendError(res, 404, 'CART_NOT_FOUND', 'Cart not found or expired.');
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json(cart);
}));

router.post('/:cartId/items', wrap(async (req: Request, res: Response) => {
  const cartId = req.params.cartId;
  const { productId, variantId, quantity } = req.body ?? {};
  if (!validCartId(cartId) || !validCartId(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    sendError(res, 400, 'VALIDATION_ERROR', 'A valid product, variant and integer quantity between 1 and 20 are required.');
    return;
  }
  if (variantId !== `${productId}-default`) {
    sendError(res, 400, 'INVALID_VARIANT', 'The selected product variant is invalid.');
    return;
  }

  const { error } = await supabase.rpc('add_cart_item', {
    p_cart_id: cartId,
    p_product_id: productId,
    p_variant_id: variantId,
    p_quantity: quantity,
  });
  if (error) {
    sendError(res, 409, 'CART_UPDATE_FAILED', error.message);
    return;
  }
  const cart = await loadCart(cartId);
  if (!cart) {
    sendError(res, 404, 'CART_NOT_FOUND', 'Cart not found or expired.');
    return;
  }
  res.json(cart);
}));

router.patch('/:cartId/items/:lineId', wrap(async (req: Request, res: Response) => {
  const { cartId, lineId } = req.params;
  const quantity = req.body?.quantity;
  if (!validCartId(cartId) || !validCartId(lineId) || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Quantity must be an integer between 0 and 20.');
    return;
  }

  const { error } = await supabase.rpc('set_cart_item_quantity', {
    p_cart_id: cartId,
    p_line_id: lineId,
    p_quantity: quantity,
  });
  if (error) {
    sendError(res, 409, 'CART_UPDATE_FAILED', error.message);
    return;
  }
  const cart = await loadCart(cartId);
  if (!cart) {
    sendError(res, 404, 'CART_NOT_FOUND', 'Cart not found or expired.');
    return;
  }
  res.json(cart);
}));

router.delete('/:cartId/items/:lineId', wrap(async (req: Request, res: Response) => {
  const { cartId, lineId } = req.params;
  if (!validCartId(cartId) || !validCartId(lineId)) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid cart or line id.');
    return;
  }

  const { error } = await supabase.rpc('set_cart_item_quantity', {
    p_cart_id: cartId,
    p_line_id: lineId,
    p_quantity: 0,
  });
  if (error) {
    sendError(res, 409, 'CART_UPDATE_FAILED', error.message);
    return;
  }
  const cart = await loadCart(cartId);
  if (!cart) {
    sendError(res, 404, 'CART_NOT_FOUND', 'Cart not found or expired.');
    return;
  }
  res.json(cart);
}));

export default router;
