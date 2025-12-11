import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  employee_id?: string;
  employee_ids?: string[];
  title: string;
  body: string;
  url?: string;
  category?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured');
      throw new Error('VAPID keys not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials not configured');
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload: PushPayload = await req.json();
    console.log('Received push notification request:', JSON.stringify(payload));

    const { title, body, url, category, data } = payload;
    
    // Get target employee IDs
    let targetEmployeeIds: string[] = [];
    if (payload.employee_id) {
      targetEmployeeIds = [payload.employee_id];
    } else if (payload.employee_ids && payload.employee_ids.length > 0) {
      targetEmployeeIds = payload.employee_ids;
    } else {
      console.error('No employee_id or employee_ids provided');
      throw new Error('No employee_id or employee_ids provided');
    }

    console.log(`Sending to ${targetEmployeeIds.length} employees`);

    // Get subscriptions for target employees
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('employee_id', targetEmployeeIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for target employees');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Check notification preferences if category is provided
    let filteredEmployeeIds = targetEmployeeIds;
    if (category) {
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('*')
        .in('employee_id', targetEmployeeIds);

      if (!prefError && preferences) {
        filteredEmployeeIds = targetEmployeeIds.filter(empId => {
          const pref = preferences.find(p => p.employee_id === empId);
          // If no preference record, default to enabled
          if (!pref) return true;
          // Check if push is enabled globally
          if (!pref.push_enabled) return false;
          // Check category-specific preference
          const categoryKey = category.replace(/-/g, '_');
          if (categoryKey in pref) {
            return pref[categoryKey as keyof typeof pref] !== false;
          }
          return true;
        });
      }
    }

    // Filter subscriptions based on preferences
    const filteredSubscriptions = subscriptions.filter(sub => 
      filteredEmployeeIds.includes(sub.employee_id)
    );

    console.log(`After preference filtering: ${filteredSubscriptions.length} subscriptions`);

    // Import web-push dynamically
    const webpush = await import("https://esm.sh/web-push@3.6.7");

    // Set VAPID details
    webpush.setVapidDetails(
      'mailto:contact@tutti.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    // Send notifications to all subscriptions
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/tutti-logo.png',
      badge: '/tutti-logo.png',
      url: url || '/',
      data: data || {},
      timestamp: Date.now(),
    });

    const results = await Promise.allSettled(
      filteredSubscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload);
          console.log(`Successfully sent to endpoint: ${sub.endpoint.substring(0, 50)}...`);
          return { success: true, endpoint: sub.endpoint };
        } catch (err: unknown) {
          const error = err as { statusCode?: number; message?: string };
          console.error(`Failed to send to endpoint: ${sub.endpoint.substring(0, 50)}...`, error);
          
          // If subscription is expired/invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing expired subscription: ${sub.id}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
          
          return { success: false, endpoint: sub.endpoint, error: error.message || 'Unknown error' };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failCount = results.length - successCount;

    console.log(`Push notification results: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: filteredSubscriptions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});