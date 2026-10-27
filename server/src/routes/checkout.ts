import { Router } from 'express';
import { rateLimit, wrap } from '../http.js';
import { supabase } from '../supabase.js';

const router = Router();

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Port of supabase/functions/create-order. Prices come from the DB only. */
router.post(
  '/checkout/orders',
  rateLimit(10, 60_000),
  wrap(async (req, res) => {
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

    const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(503).json({ error: 'Online payments are currently unavailable.' });
    }

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
    let razorpayOrderId: string;

    try {
      const rzp = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`,
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
    } catch (err) {
      console.error('Razorpay order creation failed:', err);
      // Release the reserved stock.
      await supabase.rpc('set_order_status', { p_order: orderId, p_status: 'cancelled' });
      return res.status(502).json({ error: 'Failed to initiate gateway payment session.' });
    }

    await supabase.from('orders').update({ razorpay_order_id: razorpayOrderId }).eq('id', orderId);

    res.json({
      success: true,
      orderId,
      razorpayOrderId,
      amount,
      currency: 'INR',
      keyId: razorpayKeyId,
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
    });
  })
);

export default router;
