import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

function validSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const actual = Buffer.from(signature.toLowerCase(), 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
}

function razorpayAuth(): string | null {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  return keyId && keySecret
    ? `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
    : null;
}

/**
 * Razorpay signs the exact raw request body. This router must be mounted before
 * express.json(). Payment amount/currency are reconciled against the stored order.
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
      return res.json({ status: 'ok', ignored: true });
    }

    const payment = payload.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || payload.payload?.order?.entity?.id;
    if (!razorpayOrderId || !payment?.id) {
      return res.status(400).json({ error: 'Webhook payload is missing payment identifiers' });
    }
    if (payment.status && payment.status !== 'captured') {
      return res.status(409).json({ error: 'Payment is not captured' });
    }

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status, subtotal, currency_code, razorpay_payment_id, refund_id')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    if (findError) {
      console.error('Order lookup failed:', findError.message);
      return res.status(500).json({ error: 'Unable to reconcile order' });
    }
    if (!order) {
      console.error(`Order with Razorpay order id ${razorpayOrderId} not found.`);
      return res.status(404).json({ error: 'Order not found' });
    }

    const expectedAmount = Math.round(Number(order.subtotal) * 100);
    const expectedCurrency = String(order.currency_code || 'INR').toUpperCase();
    if (!Number.isSafeInteger(expectedAmount) ||
        Number(payment.amount) !== expectedAmount ||
        String(payment.currency || '').toUpperCase() !== expectedCurrency) {
      console.error(`Payment reconciliation mismatch for order ${order.id}.`);
      return res.status(409).json({ error: 'Payment amount or currency does not match the order' });
    }

    if (['paid', 'shipped', 'delivered', 'refunded'].includes(order.status)) {
      return res.json({ status: 'ok', duplicate: true });
    }

    if (order.status === 'cancelled') {
      // A captured payment can arrive after the reservation has expired. Refund it
      // instead of silently ignoring a real charge against a cancelled order.
      let refundId = order.refund_id as string | null;
      if (!refundId) {
        const auth = razorpayAuth();
        if (!auth) {
          console.error('Cannot refund late captured payment: Razorpay credentials are missing.');
          return res.status(503).json({ error: 'Refund reconciliation is temporarily unavailable' });
        }
        const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.id)}/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({ notes: { hilo_order_id: order.id, reason: 'Late payment after order cancellation' } }),
        });
        if (!refundResponse.ok) {
          console.error('Late payment refund failed:', await refundResponse.text());
          return res.status(502).json({ error: 'Unable to refund late payment yet' });
        }
        const refund = await refundResponse.json() as { id?: string };
        refundId = refund.id || null;
        if (!refundId) return res.status(502).json({ error: 'Razorpay did not return a refund reference' });
        const { error: paymentSaveError } = await supabase
          .from('orders')
          .update({ razorpay_payment_id: payment.id, refund_id: refundId })
          .eq('id', order.id);
        if (paymentSaveError) {
          console.error('Could not save late payment refund:', paymentSaveError.message);
          return res.status(500).json({ error: 'Unable to persist refund reconciliation' });
        }
      }
      const { error: statusError } = await supabase.rpc('set_order_status', {
        p_order: order.id,
        p_status: 'refunded',
      });
      if (statusError) {
        console.error('Could not mark late payment as refunded:', statusError.message);
        return res.status(500).json({ error: 'Unable to complete refund reconciliation' });
      }
      return res.json({ status: 'ok', refundedLatePayment: true });
    }

    const { error: paymentSaveError } = await supabase
      .from('orders')
      .update({ razorpay_payment_id: payment.id })
      .eq('id', order.id);
    if (paymentSaveError) {
      console.error('Could not save Razorpay payment id:', paymentSaveError.message);
      return res.status(500).json({ error: 'Unable to persist payment reference' });
    }

    const { error: statusError } = await supabase.rpc('set_order_status', {
      p_order: order.id,
      p_status: 'paid',
    });
    if (statusError) {
      console.error(`Failed to mark order ${order.id} as paid:`, statusError.message);
      return res.status(500).json({ error: 'Unable to update order payment status' });
    }
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
