import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

function validSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Port of supabase/functions/razorpay-webhook. Needs the raw body for the HMAC, so this
 * router must be mounted before express.json(). Unlike the Edge Function, a missing
 * RAZORPAY_WEBHOOK_SECRET rejects everything instead of skipping verification.
 */
router.post('/webhooks/razorpay', express.raw({ type: '*/*', limit: '256kb' }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.header('x-razorpay-signature');
  const raw = req.body as Buffer;

  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set; rejecting webhook.');
    return res.status(500).json({ error: 'Webhook not configured' });
  }
  if (!signature) return res.status(400).json({ error: 'Missing webhook signature header' });
  if (!Buffer.isBuffer(raw) || !validSignature(raw, signature, secret)) {
    console.error('Invalid Razorpay webhook signature');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  try {
    const payload = JSON.parse(raw.toString('utf8'));
    if (payload.event !== 'order.paid' && payload.event !== 'payment.captured') {
      return res.json({ status: 'ok' });
    }

    const payment = payload.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || payload.payload?.order?.entity?.id;
    if (!razorpayOrderId) return res.json({ status: 'ignored' });

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();
    if (findError || !order) {
      console.error(`Order with razorpay_order_id ${razorpayOrderId} not found.`);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Replayed delivery: only a pending order is moved to paid.
    if (order.status !== 'pending') return res.json({ status: 'ok', duplicate: true });

    await supabase
      .from('orders')
      .update({ razorpay_payment_id: payment?.id || null })
      .eq('id', order.id);

    // set_order_status('paid') also creates the sequential HA-xxxxx invoice.
    const { error: statusError } = await supabase.rpc('set_order_status', {
      p_order: order.id,
      p_status: 'paid',
    });
    if (statusError) {
      console.error(`Failed to mark order ${order.id} as paid:`, statusError.message);
      return res.status(500).json({ error: statusError.message });
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
