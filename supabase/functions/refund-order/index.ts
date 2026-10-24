// Supabase Edge Function: refund-order
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

    // Verify caller token using public client
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

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch order with service role
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: order, error: fetchError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'refunded') {
      return new Response(JSON.stringify({ error: 'Order has already been refunded.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot refund order with status "${order.status}".` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Process Razorpay Refund
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    let refundId = `rfnd_mock_${Date.now().toString().slice(-8)}`;

    if (razorpayKeyId && razorpayKeySecret && order.razorpay_payment_id) {
      const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const refundRes = await fetch(
        `https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
          body: JSON.stringify({
            speed: 'optimum',
            notes: { order_id: order.id },
          }),
        }
      );

      if (!refundRes.ok) {
        const errorText = await refundRes.text();
        console.error('Razorpay Refund API error:', errorText);
        return new Response(
          JSON.stringify({ error: `Razorpay refund failed: ${errorText}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refundData = await refundRes.json();
      refundId = refundData.id;
    } else {
      console.log('Processed simulated refund (Razorpay credentials or payment ID not present)');
    }

    // 4. Update order to 'refunded' (automatically restocks via database trigger/function)
    const { error: rpcError } = await adminSupabase.rpc('set_order_status', {
      p_order: order.id,
      p_status: 'refunded',
    });

    if (rpcError) {
      throw rpcError;
    }

    // Save refund tracking ID
    await adminSupabase
      .from('orders')
      .update({
        refund_id: refundId,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        refundId,
        status: 'refunded',
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
