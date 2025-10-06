
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    
    const stripeSignature = req.headers.get('stripe-signature');
    if (!stripeSignature) {
      logStep("ERROR - No Stripe signature found");
      return new Response('No signature', { status: 400 });
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      logStep("ERROR - No webhook secret configured");
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, stripeSignature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logStep("ERROR - Webhook signature verification failed", { error: errorMessage });
      return new Response(`Webhook signature verification failed: ${errorMessage}`, { status: 400 });
    }

    logStep("Webhook event received", { type: event.type, id: event.id });

    // Handle relevant events for PawClub license granting
    if (event.type === 'customer.subscription.created' || 
        event.type === 'invoice.payment_succeeded') {
      
      const subscription = event.type === 'customer.subscription.created' 
        ? event.data.object 
        : await stripe.subscriptions.retrieve(event.data.object.subscription);
      
      const customer = await stripe.customers.retrieve(subscription.customer);
      const customerEmail = customer.email;

      if (!customerEmail) {
        logStep("WARNING - No customer email found", { customerId: subscription.customer });
        return new Response('No customer email', { status: 200 });
      }

      logStep("Processing subscription event", { 
        email: customerEmail, 
        subscriptionId: subscription.id,
        eventType: event.type 
      });

      // Get user from email by querying profiles table
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, email_address')
        .eq('email_address', customerEmail)
        .single();
      
      if (profileError || !profileData) {
        logStep("WARNING - User not found", { email: customerEmail, error: profileError?.message });
        return new Response('User not found', { status: 200 });
      }

      const userId = profileData.id;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      // Check existing subscriber to update subscription info only
      const { data: subscriber } = await supabaseClient
        .from('subscribers')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      logStep("Updating subscriber record", { userId, reason: event.type });
      
      // Check if this is a new subscription (not a renewal)
      const isNewSubscription = !subscriber;
      
      // Update the subscriber record with subscription information
      await supabaseClient
        .from('subscribers')
        .upsert({
          email: customerEmail,
          user_id: userId,
          stripe_customer_id: subscription.customer,
          subscribed: true,
          subscription_tier: 'PawClub',
          subscription_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      // Update profile to mark as PawClub member
      await supabaseClient
        .from('profiles')
        .update({ pawclub_member: true })
        .eq('id', userId);
      
      // Grant initial litter licenses for new subscriptions
      if (isNewSubscription) {
        logStep("New PawClub subscription detected - granting 2 litter licenses", { userId });
        
        try {
          // Grant 2 litter licenses immediately for new subscribers
          const { data: grantResult, error: grantError } = await supabaseClient
            .rpc('grant_pawclub_litter_licenses', {
              user_id_param: userId,
              license_count: 2,
              grant_reason: 'PawClub subscription signup'
            });

          if (grantError) {
            logStep("ERROR - Failed to grant initial litter licenses", { error: grantError.message, userId });
          } else {
            logStep("Successfully granted 2 initial litter licenses", { userId, result: grantResult });
          }
        } catch (licenseError) {
          logStep("ERROR - Exception while granting litter licenses", { error: licenseError, userId });
        }
      } else {
        logStep("Existing subscription renewal - litter licenses handled by daily rewards", { userId });
      }
    }

    return new Response('Webhook processed', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR - Webhook processing failed", { error: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
