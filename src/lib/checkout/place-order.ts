import { getApiBaseUrl } from '@/lib/api-url';
import type { Cart } from '@/lib/data/types';

export interface CheckoutCustomer {
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface CreateOrderResponse {
  success?: boolean;
  error?: string | { code?: string; message?: string };
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

/** Formats customer first and last name once into a consistent full name string. */
export function formatCustomerName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].map((s) => s?.trim()).filter(Boolean).join(' ').trim();
}

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

function createOrder(body: unknown): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  return fetch(`${baseUrl}/api/v1/checkout/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Creates the order server-side (price and stock are re-checked in the database;
 * client prices are ignored), then opens Razorpay. Resolves with the order id once
 * Razorpay reports success; the webhook is what actually marks the order paid.
 */
export async function placeOrder(cart: Cart, customer: CheckoutCustomer): Promise<string> {
  // Load the gateway before creating an order so script failures never reserve stock.
  await loadRazorpayScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment window unavailable. Please try again.');

  const fullName = customer.fullName?.trim() || formatCustomerName(customer.firstName, customer.lastName);
  const res = await createOrder({
    customer: {
      name: fullName,
      email: customer.email,
      phone: customer.phone,
      shippingAddress: {
        fullName,
        line1: customer.street,
        city: customer.city,
        state: customer.state,
        postalCode: customer.pincode,
        country: 'IN',
      },
    },
    items: cart.lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
  });

  const order = (await res.json().catch(() => ({}))) as Partial<CreateOrderResponse>;
  const rawError = order.error;
  const errorMessage =
    typeof rawError === 'string'
      ? rawError
      : rawError?.message ||
        (res.status === 503
          ? 'Online payments are currently unavailable. Your order was not placed and no payment was charged.'
          : 'We could not place your order. Please try again.');

  if (!res.ok || !order.orderId) {
    throw new Error(errorMessage);
  }
  if (!order.keyId || !order.razorpayOrderId || !order.amount || !order.currency) {
    throw new Error('The payment session is incomplete. Please contact support before retrying.');
  }

  return new Promise<string>((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: 'HILO ARTE',
      prefill: {
        name: fullName,
        email: customer.email,
        contact: customer.phone,
      },
      // The browser callback only advances to the pending screen. The backend
      // webhook and status endpoint remain the source of truth for payment success.
      handler: () => resolve(order.orderId!),
      modal: { ondismiss: () => reject(new PaymentCancelled()) },
    });
    rzp.on('payment.failed', (result) =>
      reject(new Error(result.error?.description || 'Payment failed. Please try again.'))
    );
    rzp.open();
  });
}
