
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const isTokenExpired = (expiresAt: number) => {
  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now + 60; // Consider expired if expires within 1 minute
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR - STRIPE_SECRET_KEY is not set");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        error: "Service configuration error" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR - No authorization header provided");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        error: "Authentication required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("ERROR - Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false, 
        error: "Invalid authentication token" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR - User email not available");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        error: "User email not available" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin and give them automatic PawClub access
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = userRoles?.some(role => role.role === 'admin');
    
    if (isAdmin) {
      logStep("Admin user detected - granting automatic PawClub access");
      
      // Check if this admin user needs litter licenses (first time admin detection)
      const { data: existingSubscriber } = await supabaseClient
        .from('subscribers')
        .select('last_license_grant_period_end')
        .eq('user_id', user.id)
        .single();

      const needsLicenses = !existingSubscriber?.last_license_grant_period_end;
      
      if (needsLicenses) {
        logStep("Granting litter licenses to new admin user");
        
        // Grant 4 litter licenses for admin
        const { data: grantResult, error: grantError } = await supabaseClient
          .rpc('grant_pawclub_litter_licenses', {
            user_id_param: user.id,
            license_count: 4,
            grant_reason: 'Admin PawClub access'
          });

        if (grantError) {
          logStep("ERROR - Failed to grant admin licenses", { error: grantError.message });
        } else {
          logStep("Successfully granted admin licenses", grantResult);
        }
      }
      
      // Update database to reflect admin subscription
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: true,
        subscription_tier: "Admin",
        subscription_end: null, // No end date for admin
        last_license_grant_period_end: needsLicenses ? new Date().toISOString() : existingSubscriber?.last_license_grant_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      await supabaseClient.from("profiles").update({
        pawclub_member: true
      }).eq("id", user.id);
      
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: "Admin",
        subscription_end: null,
        will_cancel: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check token expiry from user session
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (sessionData.session && sessionData.session.expires_at && isTokenExpired(sessionData.session.expires_at)) {
      logStep("WARNING - Token expired or expiring soon");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        error: "Session expired" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    let customers;
    try {
      customers = await stripe.customers.list({ email: user.email, limit: 1 });
    } catch (stripeError) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : String(stripeError);
      logStep("ERROR - Stripe customer lookup failed", { error: errorMessage });
      // Update database to reflect no subscription
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      await supabaseClient.from("profiles").update({
        pawclub_member: false
      }).eq("id", user.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      await supabaseClient.from("profiles").update({
        pawclub_member: false
      }).eq("id", user.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    let subscriptions;
    try {
      subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
    } catch (stripeError) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : String(stripeError);
      logStep("ERROR - Stripe subscription lookup failed", { error: errorMessage });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let willCancel = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionTier = "PawClub";
      willCancel = subscription.cancel_at_period_end || false;
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        willCancel: willCancel
      });
    } else {
      logStep("No active subscription found");
    }

    // Update subscriber record
    try {
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      await supabaseClient.from("profiles").update({
        pawclub_member: hasActiveSub
      }).eq("id", user.id);

      logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier, willCancel });
    } catch (dbError) {
      logStep("ERROR - Database update failed", { error: dbError });
      // Still return the subscription status even if DB update fails
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      will_cancel: willCancel
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    // Return a graceful response for client-side consumption
    return new Response(JSON.stringify({ 
      subscribed: false, 
      error: "Service temporarily unavailable" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
