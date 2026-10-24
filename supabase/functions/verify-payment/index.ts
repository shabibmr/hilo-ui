// Supabase Edge Function: verify-payment
// Runtime: Deno / TypeScript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    // 1. Admin Authorization Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: admin access required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch Order
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: order, error: fetchError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
      return new Response(
        JSON.stringify({
          verified: true,
          status: order.status,
          alreadyPaid: true,
          message: 'Order is already marked as paid.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Query Razorpay API for captured payments
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (razorpayKeyId && razorpayKeySecret && order.razorpay_order_id) {
      const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const rzpRes = await fetch(
        `https://api.razorpay.com/v1/orders/${order.razorpay_order_id}/payments`,
        {
          headers: { Authorization: `Basic ${basicAuth}` },
        }
      );

      if (!rzpRes.ok) {
        const errText = await rzpRes.text();
        return new Response(
          JSON.stringify({ error: `Razorpay API lookup failed: ${errText}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentsData = await rzpRes.json();
      const capturedPayment = paymentsData.items?.find(
        (p: any) => p.status === 'captured'
      );

      if (capturedPayment) {
        // Update order to paid
        await adminSupabase
          .from('orders')
          .update({ razorpay_payment_id: capturedPayment.id })
          .eq('id', order.id);

        await adminSupabase.rpc('set_order_status', {
          p_order: order.id,
          p_status: 'paid',
        });

        return new Response(
          JSON.stringify({
            verified: true,
            status: 'paid',
            paymentId: capturedPayment.id,
            message: 'Payment found and confirmed! Order marked as paid.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No captured payment confirmed
    return new Response(
      JSON.stringify({
        verified: false,
        status: order.status,
        message: 'No captured payment found on Razorpay for this order.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
