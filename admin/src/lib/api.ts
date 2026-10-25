/**
 * The only module that talks to data. Pages import from here and never use the
 * Supabase client directly. When env vars are missing, calls use the sample studio.
 */
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import * as mock from './mock-store';
import type {
  Collection,
  CollectionInput,
  Customer,
  DashboardCounts,
  Enquiry,
  ImageAsset,
  Invoice,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductInput,
  PurchaseItem,
  SiteSettings,
  Supplier,
} from './types';

export type { Session, User, ProductInput, CollectionInput };
export type { PurchaseRecord } from './mock-store';

export interface OrderBundle {
  order: Order;
  items: OrderItem[];
  invoice: Invoice | null;
  holdExpiresAt: string | null;
  holdReleased: boolean;
}

export interface PurchaseDraft {
  supplier_id: string | null;
  bill_no: string;
  bill_date: string;
  notes: string | null;
  items: Array<Omit<PurchaseItem, 'id' | 'purchase_id'>>;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder'));
}

export function isMockMode(): boolean {
  return !isSupabaseConfigured();
}

// ---------- Hilo API (NEXT_PUBLIC_DATA_MODE=api) ----------
// Sign-in stays on Supabase Auth; data calls go to the API with the access token.

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

function apiMode(): boolean {
  return !isMockMode() && process.env.NEXT_PUBLIC_DATA_MODE === 'api';
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** JSON in and out. A Blob body is sent as-is with its own content type (image uploads). */
async function request<T = void>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  let payload: BodyInit | undefined;
  if (body instanceof Blob) {
    headers['Content-Type'] = body.type;
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}/api/v1/admin${path}`, { method, headers, body: payload });
  if (res.status === 401) {
    // AuthContext listens for the sign-out and sends the user to the login page.
    await supabase.auth.signOut();
    throw new ApiError(401, 'Your session has expired. Sign in again.');
  }
  if (res.status === 403) throw new ApiError(403, 'You are not authorised to use the admin.');
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json?.error || `Request failed (${res.status}).`);
  return json as T;
}

// ---------- Auth ----------

export async function getSession(): Promise<Session | null> {
  if (isMockMode()) return mock.getMockSession();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (session: Session | null) => void): () => void {
  if (isMockMode()) return mock.onMockAuthChange(callback);
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<Session | null> {
  if (isMockMode()) return mock.mockSignIn(email, password);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || 'Invalid email or password.');
  return data.session;
}

export async function signOut(): Promise<void> {
  if (isMockMode()) {
    mock.mockSignOut();
    return;
  }
  await supabase.auth.signOut();
}

// ---------- Dashboard ----------

export async function getDashboardCounts(): Promise<DashboardCounts> {
  if (isMockMode()) return mock.getDashboardCounts();
  if (apiMode()) return request<DashboardCounts>('GET', '/dashboard/counts');
  const head = { count: 'exact', head: true } as const;
  const [products, lowStock, collections, orders, pendingOrders, enquiries] = await Promise.all([
    supabase.from('products').select('*', head),
    supabase.from('products').select('*', head).lte('stock', 3),
    supabase.from('collections').select('*', head),
    supabase.from('orders').select('*', head),
    supabase.from('orders').select('*', head).eq('status', 'pending'),
    supabase.from('enquiries').select('*', head).eq('handled', false),
  ]);

  return {
    totalProducts: products.count ?? 0,
    lowStockProducts: lowStock.count ?? 0,
    totalCollections: collections.count ?? 0,
    totalOrders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    unhandledEnquiries: enquiries.count ?? 0,
  };
}

// ---------- Products ----------

export async function listProducts(): Promise<Product[]> {
  if (isMockMode()) return mock.listProducts();
  if (apiMode()) return request<Product[]>('GET', '/products');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Product[]) || [];
}

export async function getProduct(id: string): Promise<Product> {
  if (isMockMode()) return mock.getProduct(id);
  if (apiMode()) return request<Product>('GET', `/products/${id}`);
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Product;
}

export async function createProduct(input: ProductInput): Promise<void> {
  if (isMockMode()) {
    mock.createProduct(input);
    return;
  }
  if (apiMode()) {
    await request('POST', '/products', input);
    return;
  }
  const { error } = await supabase.from('products').insert([input]);
  if (error) throw error;
}

/** Throws when RLS or a stale id filtered the write out, which Supabase reports as success. */
function requireAffected<T>(rows: T[] | null, what: string): asserts rows is T[] {
  if (!rows || rows.length === 0) {
    throw new Error(`${what} was not saved. Your session may have expired; sign in again and retry.`);
  }
}

/** Only the fields passed are written, so omit `stock` to leave live inventory untouched. */
export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  if (isMockMode()) {
    mock.updateProduct(id, input);
    return;
  }
  if (apiMode()) {
    await request('PATCH', `/products/${id}`, input);
    return;
  }
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select('id');
  if (error) throw error;
  requireAffected(data, 'The product');
}

export async function setProductPublished(id: string, published: boolean): Promise<void> {
  if (isMockMode()) {
    mock.setProductPublished(id, published);
    return;
  }
  if (apiMode()) {
    await request('PATCH', `/products/${id}/published`, { published });
    return;
  }
  const { data, error } = await supabase
    .from('products')
    .update({ published })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  requireAffected(data, 'The publish change');
}

export async function deleteProduct(id: string): Promise<void> {
  if (isMockMode()) {
    mock.deleteProduct(id);
    return;
  }
  if (apiMode()) {
    const row = await request<{ images?: ImageAsset[] }>('DELETE', `/products/${id}`);
    await Promise.all((row.images || []).map((image) => deleteImageByUrl(image.url)));
    return;
  }
  const { data, error } = await supabase.from('products').delete().eq('id', id).select('id, images');
  if (error) throw error;
  requireAffected(data, 'The deletion');
  const images = ((data[0] as { images?: ImageAsset[] }).images) || [];
  await Promise.all(images.map((image) => deleteImageByUrl(image.url)));
}

// ---------- Collections ----------

export async function listCollections(
  orderBy: 'sort_order' | 'title' = 'sort_order'
): Promise<Collection[]> {
  if (isMockMode()) return mock.listCollections(orderBy);
  if (apiMode()) {
    const rows = await request<Collection[]>('GET', '/collections');
    return orderBy === 'title' ? [...rows].sort((a, b) => a.title.localeCompare(b.title)) : rows;
  }
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order(orderBy, { ascending: true });
  if (error) throw error;
  return (data as Collection[]) || [];
}

export async function createCollection(input: CollectionInput): Promise<void> {
  if (isMockMode()) {
    mock.createCollection(input);
    return;
  }
  if (apiMode()) {
    await request('POST', '/collections', input);
    return;
  }
  const { error } = await supabase.from('collections').insert([input]);
  if (error) throw error;
}

export async function updateCollection(id: string, input: CollectionInput): Promise<void> {
  if (isMockMode()) {
    mock.updateCollection(id, input);
    return;
  }
  if (apiMode()) {
    await request('PATCH', `/collections/${id}`, input);
    return;
  }
  const { data, error } = await supabase.from('collections').update(input).eq('id', id).select('id');
  if (error) throw error;
  requireAffected(data, 'The collection');
}

/** Products reference collections by handle, so a rename or delete is unsafe while this is above 0. */
export async function countProductsInCollection(handle: string): Promise<number> {
  if (isMockMode()) {
    return mock.listProducts().filter((product) => product.collections?.includes(handle)).length;
  }
  if (apiMode()) {
    const { count } = await request<{ count: number }>(
      'GET',
      `/collections/${encodeURIComponent(handle)}/product-count`
    );
    return count;
  }
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .contains('collections', [handle]);
  if (error) throw error;
  return count ?? 0;
}

export async function setCollectionPublished(id: string, published: boolean): Promise<void> {
  if (isMockMode()) {
    mock.setCollectionPublished(id, published);
    return;
  }
  if (apiMode()) {
    await request('PATCH', `/collections/${id}/published`, { published });
    return;
  }
  const { data, error } = await supabase
    .from('collections')
    .update({ published })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  requireAffected(data, 'The publish change');
}

export async function deleteCollection(id: string): Promise<void> {
  if (isMockMode()) {
    mock.deleteCollection(id);
    return;
  }
  if (apiMode()) {
    const row = await request<{ image?: ImageAsset | null }>('DELETE', `/collections/${id}`);
    if (row.image?.url) await deleteImageByUrl(row.image.url);
    return;
  }
  const { data, error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .select('id, image');
  if (error) throw error;
  requireAffected(data, 'The deletion');
  const image = (data[0] as { image?: ImageAsset | null }).image;
  if (image?.url) await deleteImageByUrl(image.url);
}

// ---------- Image storage ----------

const BUCKET_NAME = 'product-images';

export async function uploadImageFile(file: File, folder = 'products'): Promise<ImageAsset> {
  if (isMockMode()) return mock.uploadImageFile(file);
  if (apiMode()) {
    const query = `folder=${encodeURIComponent(folder)}&name=${encodeURIComponent(file.name)}`;
    return request<ImageAsset>('POST', `/uploads/images?${query}`, file);
  }
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const fileName = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    url: publicData.publicUrl,
    altText: file.name.replace(/\.[^/.]+$/, ''),
  };
}

export async function deleteImageByUrl(url: string): Promise<void> {
  if (isMockMode()) return;
  if (apiMode()) {
    try {
      await request('DELETE', '/uploads/images', { url });
    } catch (err) {
      console.warn('Failed to delete image from storage:', err);
    }
    return;
  }
  try {
    const bucketMarker = `/${BUCKET_NAME}/`;
    const index = url.indexOf(bucketMarker);
    if (index === -1) return;

    const path = url.slice(index + bucketMarker.length);
    if (!path) return;

    await supabase.storage.from(BUCKET_NAME).remove([path]);
  } catch (err) {
    console.warn('Failed to delete image from storage:', err);
  }
}

// ---------- Orders ----------

export async function listOrders(): Promise<Order[]> {
  if (isMockMode()) return mock.listOrders();
  if (apiMode()) return request<Order[]>('GET', '/orders');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Order[]) || [];
}

export async function getOrderBundle(id: string): Promise<OrderBundle> {
  if (isMockMode()) {
    const order = mock.listOrders().find((row) => row.id === id);
    if (!order) throw new Error('Order not found.');
    return {
      order,
      items: mock.orderItems(id),
      invoice: mock.invoiceFor(id),
      holdExpiresAt: mock.holdExpiresAt(order),
      holdReleased: mock.holdIsReleased(id),
    };
  }

  if (apiMode()) return request<OrderBundle>('GET', `/orders/${id}`);

  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: items, error: itemError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);
  if (itemError) throw itemError;
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('order_id', id)
    .maybeSingle();
  if (invoiceError) throw invoiceError;

  const typed = order as Order;
  const holdExpiresAt =
    typed.status === 'pending'
      ? new Date(new Date(typed.created_at).getTime() + 15 * 60 * 1000).toISOString()
      : null;

  return {
    order: typed,
    items: (items as OrderItem[]) || [],
    invoice: (invoice as Invoice | null) || null,
    holdExpiresAt,
    holdReleased: false,
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (isMockMode()) {
    mock.updateOrderStatus(id, status);
    return;
  }
  if (apiMode()) {
    await request('PATCH', `/orders/${id}/status`, { status });
    return;
  }
  // One database transaction: status, stock restore on cancel, and invoice number.
  const { error } = await supabase.rpc('set_order_status', { p_order: id, p_status: status });
  if (error) throw error;
}

// ---------- Sales invoices ----------

export async function getInvoice(id: string): Promise<Invoice> {
  if (isMockMode()) return mock.getInvoice(id);
  if (apiMode()) return request<Invoice>('GET', `/orders/${id}/invoice`);
  const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Invoice;
}

/** Returns the order's invoice, issuing the next HA- number if it has none yet. */
export async function createInvoice(orderId: string): Promise<Invoice> {
  if (isMockMode()) return mock.createInvoice(orderId);
  if (apiMode()) return request<Invoice>('POST', `/orders/${orderId}/invoice`);
  const { data, error } = await supabase.rpc('ensure_invoice', { p_order: orderId });
  if (error) throw error;
  return data as Invoice;
}

export async function releasePendingHold(id: string): Promise<void> {
  if (isMockMode()) {
    mock.releasePendingHold(id);
    return;
  }
  if (apiMode()) {
    await request('POST', `/orders/${id}/release-hold`);
    return;
  }
  // Cancelling puts the held stock back in the same transaction.
  await updateOrderStatus(id, 'cancelled');
}

export async function refundOrder(id: string): Promise<void> {
  if (isMockMode()) {
    mock.refundOrder(id);
    return;
  }
  if (apiMode()) {
    await request('POST', `/orders/${id}/refund`);
    return;
  }
  const { data, error } = await supabase.functions.invoke('refund-order', {
    body: { orderId: id },
  });
  if (error) throw new Error(error.message || 'Failed to process refund.');
  if (data?.error) throw new Error(data.error);
}

export async function verifyPayment(
  id: string
): Promise<{ verified: boolean; status: OrderStatus; message: string }> {
  if (isMockMode()) {
    return mock.verifyPayment(id);
  }
  if (apiMode()) {
    return request<{ verified: boolean; status: OrderStatus; message: string }>(
      'POST',
      `/orders/${id}/verify-payment`
    );
  }
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { orderId: id },
  });
  if (error) throw new Error(error.message || 'Failed to verify payment with Razorpay.');
  if (data?.error) throw new Error(data.error);
  return data;
}

// ---------- Enquiries ----------

export async function listEnquiries(): Promise<Enquiry[]> {
  if (isMockMode()) return mock.listEnquiries();
  if (apiMode()) return request<Enquiry[]>('GET', '/enquiries');
  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Enquiry[]) || [];
}

export async function setEnquiryHandled(id: string, handled: boolean): Promise<void> {
  if (isMockMode()) {
    mock.setEnquiryHandled(id, handled);
    return;
  }
  if (apiMode()) {
    await request('PATCH', `/enquiries/${id}/handled`, { handled });
    return;
  }
  const { data, error } = await supabase.from('enquiries').update({ handled }).eq('id', id).select('id');
  if (error) throw error;
  requireAffected(data, 'The enquiry change');
}

// ---------- Customers ----------

export async function listCustomers(): Promise<Customer[]> {
  if (isMockMode()) return mock.listCustomers();
  if (apiMode()) return request<Customer[]>('GET', '/customers');
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw error;
  return (data as Customer[]) || [];
}

export async function getCustomer(id: string): Promise<Customer> {
  if (isMockMode()) return mock.getCustomer(id);
  if (apiMode()) return request<Customer>('GET', `/customers/${id}`);
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Customer;
}

export async function listCustomerOrders(customerId: string): Promise<Order[]> {
  if (isMockMode()) return mock.ordersForCustomer(customerId);
  if (apiMode()) return request<Order[]>('GET', `/customers/${customerId}/orders`);
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Order[]) || [];
}

// ---------- Purchases ----------

export async function listSuppliers(): Promise<Supplier[]> {
  if (isMockMode()) return mock.listSuppliers();
  if (apiMode()) return request<Supplier[]>('GET', '/suppliers');
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) throw error;
  return (data as Supplier[]) || [];
}

export async function saveSupplier(
  input: Omit<Supplier, 'id'> & { id?: string }
): Promise<Supplier> {
  if (isMockMode()) return mock.saveSupplier(input);
  if (apiMode()) {
    return input.id
      ? request<Supplier>('PATCH', `/suppliers/${input.id}`, input)
      : request<Supplier>('POST', '/suppliers', input);
  }
  if (input.id) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Supplier;
  }
  const { data, error } = await supabase.from('suppliers').insert([input]).select('*').single();
  if (error) throw error;
  return data as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  if (isMockMode()) {
    mock.deleteSupplier(id);
    return;
  }
  if (apiMode()) {
    await request('DELETE', `/suppliers/${id}`);
    return;
  }
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

export async function getPurchase(id: string): Promise<mock.PurchaseRecord> {
  if (isMockMode()) return mock.getPurchase(id);
  if (apiMode()) return request<mock.PurchaseRecord>('GET', `/purchases/${id}`);
  const { data, error } = await supabase
    .from('purchase_invoices')
    .select('*, items:purchase_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as mock.PurchaseRecord;
}

export async function listPurchases(): Promise<mock.PurchaseRecord[]> {
  if (isMockMode()) return mock.listPurchases();
  if (apiMode()) return request<mock.PurchaseRecord[]>('GET', '/purchases');
  const { data, error } = await supabase
    .from('purchase_invoices')
    .select('*')
    .order('bill_date', { ascending: false });
  if (error) throw error;
  const invoices = data || [];
  const detailed = await Promise.all(
    invoices.map(async (invoice) => {
      const { data: items, error: itemError } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', invoice.id);
      if (itemError) throw itemError;
      return { ...invoice, items: items || [] } as mock.PurchaseRecord;
    })
  );
  return detailed;
}

export async function createPurchase(input: PurchaseDraft): Promise<void> {
  if (isMockMode()) {
    mock.createPurchase(input);
    return;
  }
  if (apiMode()) {
    await request('POST', '/purchases', input);
    return;
  }
  // One database transaction: bill, lines and stock increase succeed or fail together.
  const { error } = await supabase.rpc('create_purchase', {
    p_supplier: input.supplier_id,
    p_bill_no: input.bill_no,
    p_bill_date: input.bill_date,
    p_notes: input.notes,
    p_items: input.items,
  });
  if (error) throw error;
}

// ---------- Site settings ----------

const defaultHero = {
  eyebrow: '',
  headline: '',
  subheadline: '',
  primaryCtaText: '',
  primaryCtaLink: '',
  secondaryCtaText: '',
  secondaryCtaLink: '',
  backgroundImage: null,
};

const defaultStore = {
  name: '',
  address: '',
  phone: '',
  email: '',
  hours: '',
  gstin: '',
};

const defaultSocial = { instagram: '', pinterest: '', whatsapp: '' };

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isMockMode()) return mock.getSettings();
  let data: Partial<SiteSettings> | null;
  if (apiMode()) {
    data = await request<Partial<SiteSettings> | null>('GET', '/settings');
  } else {
    const res = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (res.error) throw res.error;
    data = res.data;
  }
  if (!data) {
    return {
      id: 1,
      hero: defaultHero,
      store: defaultStore,
      social: defaultSocial,
      announcement: '',
      updated_at: new Date().toISOString(),
    };
  }
  return {
    id: 1,
    hero: { ...defaultHero, ...(data.hero || {}) },
    store: { ...defaultStore, ...(data.store || {}) },
    social: { ...defaultSocial, ...(data.social || {}) },
    announcement: data.announcement ?? '',
    updated_at: data.updated_at ?? new Date().toISOString(),
  };
}

export async function saveSiteSettings(
  input: Omit<SiteSettings, 'id' | 'updated_at'>
): Promise<void> {
  if (isMockMode()) {
    mock.saveSettings(input);
    return;
  }
  if (apiMode()) {
    await request('PUT', '/settings', input);
    return;
  }
  const { error } = await supabase.from('site_settings').upsert([
    {
      id: 1,
      ...input,
      updated_at: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
}
