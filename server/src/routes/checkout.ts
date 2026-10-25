import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Per-IP limiter for the public route: 10 orders per minute.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Port of supabase/functions/create-order. Prices come from the DB only. */
router.post('/checkout/orders', async (req, res) => {
  if (limited(req.ip ?? 'unknown')) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }

  const { customer, items } = req.body ?? {};
  const addr = customer?.shippingAddress;
  if (!str(customer?.name) || !str(customer?.email)) {
    return res.status(400).json({ error: 'Customer name and email are required.' });
  }
  if (!str(addr?.line1) || !str(addr?.city)) {
    return res.status(400).json({ error: 'Incomplete delivery shipping address.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }
  for (const it of items) {
    if (!str(it?.productId) || typeof it.quantity !== 'number' || it.quantity < 1) {
      return res.status(400).json({ error: 'Invalid product or quantity in line items.' });
    }
  }

  try {
    const { data: result, error: dbError } = await supabase.rpc('create_order_atomic', {
      p_customer: {
        name: str(customer.name),
        email: str(customer.email),
        phone: str(customer.phone) || null,
        shipping_address: addr,
      },
      p_items: items.map((it: { productId: string; quantity: number }) => ({
        product_id: it.productId,
        quantity: Math.floor(it.quantity),
      })),
      p_razorpay_order_id: null,
    });
    if (dbError) return res.status(400).json({ error: dbError.message || 'Unable to place order.' });

    const orderId: string = result.order_id;
    const amount = Math.round(Number(result.subtotal) * 100);
    let razorpayOrderId = `order_${orderId.replace(/-/g, '').slice(0, 16)}`;

    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const rzp = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: `rcpt_${orderId.slice(0, 10)}`,
          notes: { hilo_order_id: orderId, customer_email: str(customer.email) },
        }),
      });
      if (!rzp.ok) {
        console.error('Razorpay order creation failed:', await rzp.text());
        // Release the reserved stock.
        await supabase.rpc('set_order_status', { p_order: orderId, p_status: 'cancelled' });
        return res.status(502).json({ error: 'Failed to initiate gateway payment session.' });
      }
      razorpayOrderId = ((await rzp.json()) as { id: string }).id;
    } else {
      console.warn('RAZORPAY_KEY_ID not set; using placeholder order id.');
    }

    await supabase.from('orders').update({ razorpay_order_id: razorpayOrderId }).eq('id', orderId);

    res.json({
      success: true,
      orderId,
      razorpayOrderId,
      amount,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (err) {
    console.error('create order error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
