// Supabase Edge Function: razorpay-webhook
// Runtime: Deno / TypeScript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifyHmacSha256(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expectedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex.toLowerCase() === signature.toLowerCase();
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

  const rawBody = await req.text();

  // 1. Signature Verification
  if (webhookSecret && signature) {
    const isValid = await verifyHmacSha256(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else if (webhookSecret && !signature) {
    return new Response(JSON.stringify({ error: 'Missing webhook signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`Received Razorpay Webhook Event: ${event}`);

    // Handle payment captured or order paid
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (!razorpayOrderId) {
        console.warn('Webhook payload missing razorpay order_id');
        return new Response(JSON.stringify({ status: 'ignored' }), { status: 200 });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find order by razorpay_order_id
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (findError || !order) {
        console.error(`Order with razorpay_order_id ${razorpayOrderId} not found.`);
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
      }

      // Update payment ID and mark as paid
      await supabase
        .from('orders')
        .update({
          razorpay_payment_id: razorpayPaymentId || null,
        })
        .eq('id', order.id);

      // set_order_status automatically creates sequential invoice HA-XXXXX
      const { error: statusError } = await supabase.rpc('set_order_status', {
        p_order: order.id,
        p_status: 'paid',
      });

      if (statusError) {
        console.error(`Failed to mark order ${order.id} as paid:`, statusError.message);
        return new Response(JSON.stringify({ error: statusError.message }), { status: 500 });
      }

      console.log(`Order ${order.id} marked as paid. Invoice generated.`);
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook processing error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
