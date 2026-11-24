export interface NormalizedCheckoutCustomer {
  name: string;
  email: string;
  phone: string | null;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface NormalizedCheckoutItem {
  product_id: string;
  quantity: number;
}

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_LINE_QUANTITY = 20;
export const MAX_ORDER_LINES = 30;

const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export function validateCheckoutCustomer(input: unknown): ValidationResult<NormalizedCheckoutCustomer> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Customer information is required.' };
  }
  const customer = input as Record<string, unknown>;
  const address = customer.shippingAddress && typeof customer.shippingAddress === 'object'
    ? customer.shippingAddress as Record<string, unknown>
    : {};
  const name = str(customer.name);
  const email = str(customer.email).toLowerCase();
  const phone = str(customer.phone);

  if (!name || name.length > 120 || !EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: 'A valid customer name and email are required.' };
  }
  if (phone.length > 32) return { ok: false, error: 'Phone number is too long.' };

  const line1 = str(address.line1);
  const line2 = str(address.line2);
  const city = str(address.city);
  const state = str(address.state);
  const postalCode = str(address.postalCode);
  if (!line1 || !city || !state || !postalCode) {
    return { ok: false, error: 'Complete shipping address, city, state and postal code are required.' };
  }
  if (line1.length > 200 || line2.length > 200 || city.length > 100 ||
      state.length > 100 || postalCode.length > 20) {
    return { ok: false, error: 'One or more shipping address fields are too long.' };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      phone: phone || null,
      shippingAddress: {
        fullName: str(address.fullName) || name,
        line1,
        line2: line2 || null,
        city,
        state,
        postalCode,
        country: str(address.country) || 'IN',
      },
    },
  };
}

export function normalizeCheckoutItems(input: unknown): ValidationResult<NormalizedCheckoutItem[]> {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_ORDER_LINES) {
    return { ok: false, error: `Order must contain between 1 and ${MAX_ORDER_LINES} line items.` };
  }

  const quantities = new Map<string, number>();
  for (const raw of input) {
    const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    const productId = str(item.productId);
    const quantity = item.quantity;
    if (!productId || productId.length > 64 || !Number.isSafeInteger(quantity) ||
        Number(quantity) < 1 || Number(quantity) > MAX_LINE_QUANTITY) {
      return { ok: false, error: `Each quantity must be a whole number between 1 and ${MAX_LINE_QUANTITY}.` };
    }

    const combined = (quantities.get(productId) ?? 0) + Number(quantity);
    if (combined > MAX_LINE_QUANTITY) {
      return { ok: false, error: `Combined quantity for a product cannot exceed ${MAX_LINE_QUANTITY}.` };
    }
    quantities.set(productId, combined);
  }

  return {
    ok: true,
    value: [...quantities.entries()].map(([product_id, quantity]) => ({ product_id, quantity })),
  };
}
