import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

function validSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Razorpay webhooks require the exact raw request body for signature verification.
 * This router must remain mounted before express.json().
 */
router.post('/webhooks/razorpay', express.raw({ type: '*/*', limit: '256kb' }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.header('x-razorpay-signature') ?? '';
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
      return res.json({ status: 'ok', ignored: true });
    }

    const payment = payload.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || payload.payload?.order?.entity?.id;
    const eventId = req.header('x-razorpay-event-id');
    if (!eventId) return res.status(400).json({ error: 'Missing Razorpay event ID' });
    if (!razorpayOrderId || !payment?.id) {
      return res.status(400).json({ error: 'Webhook is missing payment/order identifiers' });
    }
    if (payment.status !== 'captured') {
      return res.status(409).json({ error: 'Payment is not captured' });
    }
    if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0 || typeof payment.currency !== 'string') {
      return res.status(400).json({ error: 'Invalid payment amount or currency' });
    }

    const { data, error } = await supabase.rpc('process_razorpay_payment', {
      p_event_id: eventId,
      p_event_type: payload.event,
      p_razorpay_order_id: razorpayOrderId,
      p_payment_id: payment.id,
      p_amount_paise: payment.amount,
      p_currency: payment.currency,
      p_payment_status: payment.status,
    });

    if (error) {
      console.error('Razorpay webhook database processing failed:', error.message);
      // Non-2xx prompts Razorpay to retry; the RPC transaction does not persist failed events.
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
    return res.json(data ?? { status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err instanceof Error ? err.message : err);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
});

export default router;
