import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, icon, data, userId, sendToAll } = await req.json();

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    
    if (!sendToAll && userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw error;
    }

    const payload = JSON.stringify({ title, body, icon, data });
    const results: Array<{ id: string; status: string; error?: string }> = [];

    // Use web-push npm package via esm.sh
    const webPush = await import("https://esm.sh/web-push@3.6.7");
    
    webPush.setVapidDetails(
      'mailto:beehivecarrybee@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    for (const sub of subscriptions || []) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webPush.sendNotification(pushSubscription, payload);
        results.push({ id: sub.id, status: 'sent' });
      } catch (e: unknown) {
        const error = e as { statusCode?: number; message?: string };
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired, remove it
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          results.push({ id: sub.id, status: 'removed' });
        } else {
          console.error('Push error for subscription:', sub.id, error);
          results.push({ id: sub.id, status: 'error', error: error.message || 'Unknown error' });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Push notification error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
