import type { Cart } from '@/lib/data/types';

export interface CheckoutCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface CreateOrderResponse {
  success?: boolean;
  error?: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}


interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (res: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export class PaymentCancelled extends Error {
  constructor() {
    super('Payment was not completed. Your items stay reserved for 15 minutes.');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const CHECKOUT_MODE = process.env.NEXT_PUBLIC_CHECKOUT_MODE === 'api' ? 'api' : 'edge';

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection and retry.'));
    document.body.appendChild(script);
  });
}

/** Calls the Edge Function or the API per NEXT_PUBLIC_CHECKOUT_MODE; both return the same shape. */
function createOrder(body: unknown): Promise<Response> {
  if (CHECKOUT_MODE === 'api') {
    if (!API_URL) throw new Error('Checkout is not configured for this environment.');
    return fetch(`${API_URL}/api/v1/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Checkout is not configured for this environment.');
  }
  return fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Creates the order server-side (price and stock are re-checked in the database;
 * client prices are ignored), then opens Razorpay. Resolves with the order id once
 * Razorpay reports success; the webhook is what actually marks the order paid.
 */
export async function placeOrder(cart: Cart, customer: CheckoutCustomer): Promise<string> {
  const res = await createOrder({
    customer: {
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email,
      phone: customer.phone,
      shippingAddress: {
        fullName: `${customer.firstName} ${customer.lastName}`.trim(),
        line1: customer.street,
        city: customer.city,
        state: customer.state,
        postalCode: customer.pincode,
        country: 'IN',
      },
    },
    items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
  });

  const order = (await res.json().catch(() => ({}))) as CreateOrderResponse;
  if (!res.ok || !order.orderId) {
    throw new Error(order.error || 'We could not place your order. Please try again.');
  }
  if (!order.keyId) {
    throw new Error('Online payments are not enabled yet. Your order was not charged.');
  }

  await loadRazorpayScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment window unavailable. Please try again.');

  return new Promise<string>((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: 'HILO ARTE',
      prefill: {
        name: `${customer.firstName} ${customer.lastName}`.trim(),
        email: customer.email,
        contact: customer.phone,
      },
      handler: () => resolve(order.orderId),
      modal: { ondismiss: () => reject(new PaymentCancelled()) },
    });
    rzp.on('payment.failed', (r) =>
      reject(new Error(r.error?.description || 'Payment failed. Please try again.'))
    );
    rzp.open();
  });
}
