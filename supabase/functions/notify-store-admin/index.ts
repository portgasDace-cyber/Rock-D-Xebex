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
    const { storeId, orderId, totalAmount } = await req.json();

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get store admin for this store
    const { data: storeAdmins, error: adminError } = await supabase
      .from('store_admins')
      .select('user_id')
      .eq('store_id', storeId);

    if (adminError) {
      console.error('Error fetching store admins:', adminError);
      throw adminError;
    }

    if (!storeAdmins || storeAdmins.length === 0) {
      console.log('No store admin found for store:', storeId);
      return new Response(
        JSON.stringify({ success: true, message: 'No store admin to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions for all store admins
    const adminUserIds = storeAdmins.map(a => a.user_id);
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', adminUserIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for store admins');
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title: '🔔 New Order Received!',
      body: `Order #${orderId.slice(0, 8)} - ₹${totalAmount}`,
      icon: '/favicon.ico',
      data: { 
        url: '/store-admin/orders',
        orderId: orderId
      }
    });

    const results: Array<{ id: string; status: string; error?: string }> = [];

    // Use web-push npm package via esm.sh
    const webPush = await import("https://esm.sh/web-push@3.6.7");
    
    webPush.setVapidDetails(
      'mailto:beehivecarrybee@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    for (const sub of subscriptions) {
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
        console.log('Push notification sent to:', sub.id);
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
    console.error('Store admin notification error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
