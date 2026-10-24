// Supabase Edge Function: create-order
// Runtime: Deno / TypeScript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CreateOrderRequest {
  customer: {
    name: string;
    email: string;
    phone?: string;
    shippingAddress: ShippingAddress;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: CreateOrderRequest = await req.json();
    const { customer, items } = body;

    // 1. Input Validation
    if (!customer || !customer.name?.trim() || !customer.email?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Customer name and email are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customer.shippingAddress || !customer.shippingAddress.line1 || !customer.shippingAddress.city) {
      return new Response(
        JSON.stringify({ error: 'Incomplete delivery shipping address.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Order must contain at least one item.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid product or quantity in line items.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Initialize Supabase Admin Client (Service Role Key bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment credentials not configured on Edge Function.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Atomically check stock and compute true price from DB via RPC
    // Note: Any client prices sent in the request are completely ignored.
    const { data: orderResult, error: dbError } = await supabase.rpc('create_order_atomic', {
      p_customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone?.trim() || null,
        shipping_address: customer.shippingAddress,
      },
      p_items: items.map((it) => ({
        product_id: it.productId,
        quantity: Math.floor(it.quantity),
      })),
      p_razorpay_order_id: null,
    });

    if (dbError) {
      // Handles insufficient stock or unpublished products atomically
      return new Response(
        JSON.stringify({ error: dbError.message || 'Unable to place order.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id, subtotal } = orderResult;
    const amountInPaise = Math.round(Number(subtotal) * 100);

    // 4. Create Razorpay Order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

    let razorpayOrderId = `order_${order_id.replace(/-/g, '').slice(0, 16)}`;

    if (razorpayKeyId && razorpayKeySecret) {
      const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${order_id.slice(0, 10)}`,
          notes: {
            hilo_order_id: order_id,
            customer_email: customer.email,
          },
        }),
      });

      if (!rzpRes.ok) {
        const rzpErr = await rzpRes.text();
        console.error('Razorpay Order Creation Failed:', rzpErr);
        // Rollback: cancel the order to release reserved stock
        await supabase.rpc('set_order_status', { p_order: order_id, p_status: 'cancelled' });
        return new Response(
          JSON.stringify({ error: 'Failed to initiate gateway payment session.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rzpData = await rzpRes.json();
      razorpayOrderId = rzpData.id;

      // Update order record with Razorpay Order ID
      await supabase
        .from('orders')
        .update({ razorpay_order_id: razorpayOrderId })
        .eq('id', order_id);
    } else {
      console.warn('RAZORPAY_KEY_ID not set; using sandbox placeholder order ID.');
      await supabase
        .from('orders')
        .update({ razorpay_order_id: razorpayOrderId })
        .eq('id', order_id);
    }

    // 5. Return Order Confirmation to Frontend Checkout
    return new Response(
      JSON.stringify({
        success: true,
        orderId: order_id,
        razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: razorpayKeyId,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Create Order Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
