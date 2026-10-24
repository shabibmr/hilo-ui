// Supabase Edge Function: release-expired-orders
// Runtime: Deno / TypeScript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call stored procedure to release orders pending for > 15 minutes
    const { data: releasedCount, error } = await supabase.rpc('release_expired_pending_orders');

    if (error) {
      console.error('Failed to release expired orders:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`Successfully released ${releasedCount} expired pending order(s) back to inventory.`);

    return new Response(
      JSON.stringify({
        status: 'success',
        releasedCount,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
