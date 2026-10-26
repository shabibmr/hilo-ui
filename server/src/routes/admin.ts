import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import express from 'express';
import { requireAdmin } from '../auth.js';
import { readPagination, setPaginationHeaders } from '../http.js';
import { normalizeHandleOnUpdate, requireHandle } from '../slug.js';
import { supabase } from '../supabase.js';

const BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const HOLD_MS = 15 * 60 * 1000;

const router = Router();
router.use('/admin', requireAdmin);

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Express 4 does not catch async errors; this forwards them to the handler at the bottom. */
const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

type DbError = { message: string; code?: string } | null;
function check(error: DbError) {
  if (!error) return;
  // 23505 unique, 23503 foreign key, 23514 check; P0001 is a raise from our SQL functions.
  const status = error.code === '23505' || error.code === '23503' ? 409 : error.code ? 422 : 500;
  throw new HttpError(status, error.message);
}

/** Supabase reports a filtered-out write as success; treat zero rows as not found. */
function found<T>(rows: T[] | null, what: string): T[] {
  if (!rows || rows.length === 0) throw new HttpError(404, `${what} not found.`);
  return rows;
}

const PROTECTED = ['id', 'created_at', 'updated_at'];
function body(req: Request): Record<string, unknown> {
  const b = req.body;
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw new HttpError(400, 'JSON body required.');
  const copy = { ...(b as Record<string, unknown>) };
  for (const k of PROTECTED) delete copy[k];
  return copy;
}

const id = (req: Request) => String(req.params.id);

type Prepare = (row: Record<string, unknown>) => Record<string, unknown>;

function parseListPagination(req: Request) {
  const pg = readPagination(req.query);
  if ('error' in pg) throw new HttpError(400, pg.error);
  return pg;
}

function crud(
  path: string,
  table: string,
  orderBy: string,
  ascending = true,
  opts?: { prepareCreate?: Prepare; prepareUpdate?: Prepare }
) {
  router.get(`/admin/${path}`, wrap(async (req, res) => {
    const pg = parseListPagination(req);
    const selectOpts = pg.enabled ? ({ count: 'exact' } as const) : undefined;
    let query = supabase.from(table).select('*', selectOpts).order(orderBy, { ascending });
    if (pg.enabled) query = query.range(pg.from, pg.to);
    const { data, error, count } = await query;
    check(error);
    if (pg.enabled) setPaginationHeaders(res, count ?? 0, pg.page, pg.limit);
    res.json(data ?? []);
  }));
  router.post(`/admin/${path}`, wrap(async (req, res) => {
    let row = body(req);
    try {
      if (opts?.prepareCreate) row = opts.prepareCreate(row);
    } catch (e) {
      throw new HttpError(400, e instanceof Error ? e.message : 'Invalid body');
    }
    const { data, error } = await supabase.from(table).insert([row]).select('*').single();
    check(error);
    res.status(201).json(data);
  }));
  router.patch(`/admin/${path}/:id`, wrap(async (req, res) => {
    let row = body(req);
    try {
      if (opts?.prepareUpdate) row = opts.prepareUpdate(row);
    } catch (e) {
      throw new HttpError(400, e instanceof Error ? e.message : 'Invalid body');
    }
    const { data, error } = await supabase.from(table).update(row).eq('id', id(req)).select('*');
    check(error);
    res.json(found(data, 'Record')[0]);
  }));
  router.delete(`/admin/${path}/:id`, wrap(async (req, res) => {
    const { data, error } = await supabase.from(table).delete().eq('id', id(req)).select('*');
    check(error);
    res.json(found(data, 'Record')[0]);
  }));
}

// ---------- Dashboard ----------

router.get('/admin/dashboard/counts', wrap(async (_req, res) => {
  const head = { count: 'exact', head: true } as const;
  const [products, lowStock, collections, orders, pending, enquiries] = await Promise.all([
    supabase.from('products').select('*', head),
    supabase.from('products').select('*', head).lte('stock', 3),
    supabase.from('collections').select('*', head),
    supabase.from('orders').select('*', head),
    supabase.from('orders').select('*', head).eq('status', 'pending'),
    supabase.from('enquiries').select('*', head).eq('handled', false),
  ]);
  for (const r of [products, lowStock, collections, orders, pending, enquiries]) check(r.error);
  res.json({
    totalProducts: products.count ?? 0,
    lowStockProducts: lowStock.count ?? 0,
    totalCollections: collections.count ?? 0,
    totalOrders: orders.count ?? 0,
    pendingOrders: pending.count ?? 0,
    unhandledEnquiries: enquiries.count ?? 0,
  });
}));

// ---------- Images ----------

function pathInBucket(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length) || null;
}

async function removeImages(urls: string[]) {
  const paths = urls.map(pathInBucket).filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

/** Raw image body (not multipart): POST /admin/uploads/images?folder=products&name=photo.jpg */
router.post(
  '/admin/uploads/images',
  express.raw({ type: Object.keys(IMAGE_TYPES), limit: MAX_IMAGE_BYTES }),
  wrap(async (req, res) => {
    const type = (req.header('content-type') ?? '').split(';')[0].trim();
    const ext = IMAGE_TYPES[type];
    if (!ext) throw new HttpError(415, 'Only jpeg, png and webp images are allowed.');
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw new HttpError(400, 'Image body required.');

    const folder = String(req.query.folder ?? 'products').replace(/[^a-z0-9_-]/gi, '') || 'products';
    const name = String(req.query.name ?? 'image').replace(/\.[^/.]+$/, '');
    const clean = name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const path = `${folder}/${Date.now()}_${clean}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.body, { contentType: type, cacheControl: '3600', upsert: false });
    if (error) throw new HttpError(500, `Failed to upload image: ${error.message}`);
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    res.status(201).json({ url: pub.publicUrl, altText: name });
  })
);

router.delete('/admin/uploads/images', wrap(async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url : '';
  if (!pathInBucket(url)) throw new HttpError(400, 'url must point inside the product image bucket.');
  await removeImages([url]);
  res.status(204).end();
}));

// ---------- Collections ----------

crud('collections', 'collections', 'sort_order', true, {
  prepareCreate: requireHandle,
  prepareUpdate: normalizeHandleOnUpdate,
});
router.get('/admin/collections/:handle/product-count', wrap(async (req, res) => {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .contains('collections', [String(req.params.handle)]);
  check(error);
  res.json({ count: count ?? 0 });
}));
router.patch('/admin/collections/:id/published', wrap(async (req, res) => {
  const { data, error } = await supabase
    .from('collections').update({ published: !!req.body?.published }).eq('id', id(req)).select('id');
  check(error);
  found(data, 'Collection');
  res.status(204).end();
}));

// ---------- Products ----------

crud('products', 'products', 'created_at', false, {
  prepareCreate: requireHandle,
  prepareUpdate: normalizeHandleOnUpdate,
});
router.get('/admin/products/:id', wrap(async (req, res) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id(req)).maybeSingle();
  check(error);
  if (!data) throw new HttpError(404, 'Product not found.');
  res.json(data);
}));
router.patch('/admin/products/:id/published', wrap(async (req, res) => {
  const { data, error } = await supabase
    .from('products').update({ published: !!req.body?.published }).eq('id', id(req)).select('id');
  check(error);
  found(data, 'Product');
  res.status(204).end();
}));

// ---------- Orders ----------

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

router.get('/admin/orders', wrap(async (req, res) => {
  const pg = parseListPagination(req);
  const status =
    typeof req.query.status === 'string' && req.query.status.trim()
      ? req.query.status.trim()
      : undefined;
  if (status && !STATUSES.includes(status)) {
    throw new HttpError(400, 'Unknown order status filter.');
  }

  const selectOpts = pg.enabled ? ({ count: 'exact' } as const) : undefined;
  let query = supabase.from('orders').select('*', selectOpts).order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (pg.enabled) query = query.range(pg.from, pg.to);
  const { data, error, count } = await query;
  check(error);
  if (pg.enabled) setPaginationHeaders(res, count ?? 0, pg.page, pg.limit);
  res.json(data ?? []);
}));

router.get('/admin/orders/:id', wrap(async (req, res) => {
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id(req)).maybeSingle();
  check(error);
  if (!order) throw new HttpError(404, 'Order not found.');
  const [items, invoice] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id),
    supabase.from('invoices').select('*').eq('order_id', order.id).maybeSingle(),
  ]);
  check(items.error);
  check(invoice.error);
  res.json({
    order,
    items: items.data ?? [],
    invoice: invoice.data ?? null,
    holdExpiresAt:
      order.status === 'pending'
        ? new Date(new Date(order.created_at).getTime() + HOLD_MS).toISOString()
        : null,
    holdReleased: false,
  });
}));

async function setStatus(orderId: string, status: string) {
  const { error } = await supabase.rpc('set_order_status', { p_order: orderId, p_status: status });
  check(error);
}

router.patch('/admin/orders/:id/status', wrap(async (req, res) => {
  const status = req.body?.status;
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Unknown order status.');
  await setStatus(id(req), status);
  res.status(204).end();
}));

// Cancelling puts the held stock back in the same transaction.
router.post('/admin/orders/:id/release-hold', wrap(async (req, res) => {
  await setStatus(id(req), 'cancelled');
  res.status(204).end();
}));

router.get('/admin/orders/:id/invoice', wrap(async (req, res) => {
  const { data, error } = await supabase.from('invoices').select('*').eq('order_id', id(req)).maybeSingle();
  check(error);
  if (!data) throw new HttpError(404, 'Invoice not found.');
  res.json(data);
}));
router.post('/admin/orders/:id/invoice', wrap(async (req, res) => {
  const { data, error } = await supabase.rpc('ensure_invoice', { p_order: id(req) });
  check(error);
  res.json(data);
}));

// ---------- Razorpay-backed order actions ----------

function rzpAuth(): string | null {
  const k = process.env.RAZORPAY_KEY_ID;
  const s = process.env.RAZORPAY_KEY_SECRET;
  return k && s ? `Basic ${Buffer.from(`${k}:${s}`).toString('base64')}` : null;
}

async function loadOrder(orderId: string) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  check(error);
  if (!data) throw new HttpError(404, 'Order not found.');
  return data;
}

/** Port of supabase/functions/refund-order. */
router.post('/admin/orders/:id/refund', wrap(async (req, res) => {
  const order = await loadOrder(id(req));
  if (order.status === 'refunded') throw new HttpError(400, 'Order has already been refunded.');
  if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
    throw new HttpError(400, `Cannot refund order with status "${order.status}".`);
  }

  let refundId = `rfnd_mock_${Date.now().toString().slice(-8)}`;
  const auth = rzpAuth();
  if (auth && order.razorpay_payment_id) {
    const r = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ speed: 'optimum', notes: { order_id: order.id } }),
    });
    if (!r.ok) {
      console.error('Razorpay refund failed:', await r.text());
      throw new HttpError(502, 'Razorpay refund failed.');
    }
    refundId = ((await r.json()) as { id: string }).id;
  }

  await setStatus(order.id, 'refunded'); // also restocks
  await supabase
    .from('orders')
    .update({ refund_id: refundId, refunded_at: new Date().toISOString() })
    .eq('id', order.id);
  res.json({ success: true, orderId: order.id, refundId, status: 'refunded' });
}));

/** Port of supabase/functions/verify-payment: reconcile a stuck pending order. */
router.post('/admin/orders/:id/verify-payment', wrap(async (req, res) => {
  const order = await loadOrder(id(req));
  if (['paid', 'shipped', 'delivered'].includes(order.status)) {
    return res.json({ verified: true, status: order.status, message: 'Order is already marked as paid.' });
  }

  const auth = rzpAuth();
  if (auth && order.razorpay_order_id) {
    const r = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpay_order_id}/payments`, {
      headers: { Authorization: auth },
    });
    if (!r.ok) {
      console.error('Razorpay lookup failed:', await r.text());
      throw new HttpError(502, 'Razorpay API lookup failed.');
    }
    const items = ((await r.json()) as { items?: Array<{ id: string; status: string }> }).items;
    const captured = items?.find((p) => p.status === 'captured');
    if (captured) {
      await supabase.from('orders').update({ razorpay_payment_id: captured.id }).eq('id', order.id);
      await setStatus(order.id, 'paid');
      return res.json({
        verified: true,
        status: 'paid',
        paymentId: captured.id,
        message: 'Payment found and confirmed! Order marked as paid.',
      });
    }
  }
  res.json({
    verified: false,
    status: order.status,
    message: 'No captured payment found on Razorpay for this order.',
  });
}));

// ---------- Enquiries ----------

router.get('/admin/enquiries', wrap(async (req, res) => {
  const pg = parseListPagination(req);
  const handledRaw =
    typeof req.query.handled === 'string' ? req.query.handled.trim().toLowerCase() : '';
  const kind =
    typeof req.query.kind === 'string' && req.query.kind.trim()
      ? req.query.kind.trim()
      : undefined;

  const selectOpts = pg.enabled ? ({ count: 'exact' } as const) : undefined;
  let query = supabase
    .from('enquiries')
    .select('*', selectOpts)
    .order('created_at', { ascending: false });
  if (handledRaw === 'true' || handledRaw === 'false') {
    query = query.eq('handled', handledRaw === 'true');
  }
  if (kind) query = query.eq('kind', kind);
  if (pg.enabled) query = query.range(pg.from, pg.to);
  const { data, error, count } = await query;
  check(error);
  if (pg.enabled) setPaginationHeaders(res, count ?? 0, pg.page, pg.limit);
  res.json(data ?? []);
}));
router.patch('/admin/enquiries/:id/handled', wrap(async (req, res) => {
  const { data, error } = await supabase
    .from('enquiries').update({ handled: !!req.body?.handled }).eq('id', id(req)).select('id');
  check(error);
  found(data, 'Enquiry');
  res.status(204).end();
}));

// ---------- Customers ----------

router.get('/admin/customers', wrap(async (req, res) => {
  const pg = parseListPagination(req);
  const selectOpts = pg.enabled ? ({ count: 'exact' } as const) : undefined;
  let query = supabase.from('customers').select('*', selectOpts).order('name');
  if (pg.enabled) query = query.range(pg.from, pg.to);
  const { data, error, count } = await query;
  check(error);
  if (pg.enabled) setPaginationHeaders(res, count ?? 0, pg.page, pg.limit);
  res.json(data ?? []);
}));
router.get('/admin/customers/:id', wrap(async (req, res) => {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id(req)).maybeSingle();
  check(error);
  if (!data) throw new HttpError(404, 'Customer not found.');
  res.json(data);
}));
router.get('/admin/customers/:id/orders', wrap(async (req, res) => {
  const { data, error } = await supabase
    .from('orders').select('*').eq('customer_id', id(req)).order('created_at', { ascending: false });
  check(error);
  res.json(data ?? []);
}));

// ---------- Suppliers and purchases ----------

crud('suppliers', 'suppliers', 'name');

router.get('/admin/purchases', wrap(async (req, res) => {
  const pg = parseListPagination(req);
  const selectOpts = pg.enabled ? ({ count: 'exact' } as const) : undefined;
  let query = supabase
    .from('purchase_invoices')
    .select('*, items:purchase_items(*)', selectOpts)
    .order('bill_date', { ascending: false });
  if (pg.enabled) query = query.range(pg.from, pg.to);
  const { data, error, count } = await query;
  check(error);
  if (pg.enabled) setPaginationHeaders(res, count ?? 0, pg.page, pg.limit);
  res.json(data ?? []);
}));
router.get('/admin/purchases/:id', wrap(async (req, res) => {
  const { data, error } = await supabase
    .from('purchase_invoices').select('*, items:purchase_items(*)').eq('id', id(req)).maybeSingle();
  check(error);
  if (!data) throw new HttpError(404, 'Purchase not found.');
  res.json(data);
}));
// One database transaction: bill, lines and stock increase succeed or fail together.
router.post('/admin/purchases', wrap(async (req, res) => {
  const b = req.body ?? {};
  if (!Array.isArray(b.items) || b.items.length === 0) throw new HttpError(400, 'At least one item is required.');
  for (const it of b.items) {
    if (!it?.product_id || !(Number(it.quantity) > 0)) {
      throw new HttpError(400, 'Each item needs a product_id and a positive quantity.');
    }
  }
  const { error } = await supabase.rpc('create_purchase', {
    p_supplier: b.supplier_id ?? null,
    p_bill_no: b.bill_no,
    p_bill_date: b.bill_date,
    p_notes: b.notes ?? null,
    p_items: b.items,
  });
  check(error);
  res.status(201).end();
}));

// ---------- Site settings ----------

router.get('/admin/settings', wrap(async (_req, res) => {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  check(error);
  res.json(data);
}));
router.put('/admin/settings', wrap(async (req, res) => {
  const b = body(req);
  const { error } = await supabase
    .from('site_settings')
    .upsert([{ ...b, id: 1, updated_at: new Date().toISOString() }]);
  check(error);
  res.status(204).end();
}));

// ---------- Errors ----------

router.use('/admin', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error('admin route error:', err instanceof Error ? err.message : err);
  res.status(500).json({ error: 'Internal server error' });
});

export default router;
