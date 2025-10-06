import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started - immediate execution check");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Stripe secret key not found");
      return new Response(JSON.stringify({ 
        code: "STRIPE_KEY_MISSING",
        error: "Stripe secret key is not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(JSON.stringify({ 
        code: "AUTH_REQUIRED",
        error: "No authorization header provided" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("ERROR: User authentication failed", { error: userError });
      return new Response(JSON.stringify({ 
        code: "AUTH_FAILED",
        error: userError?.message || "Invalid token" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: No user email found");
      return new Response(JSON.stringify({ 
        code: "EMAIL_MISSING",
        error: "User email not available" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe with latest API version
    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2024-06-20",
      typescript: true 
    });
    logStep("Stripe client initialized with latest API version");

    // Find customer by email
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1,
      expand: ['data.subscriptions']
    });
    
    if (customers.data.length === 0) {
      logStep("ERROR: No Stripe customer found");
      return new Response(JSON.stringify({ 
        code: "CUSTOMER_NOT_FOUND",
        error: "No Stripe customer found for this email address" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }
    
    const customer = customers.data[0];
    const customerId = customer.id;
    logStep("Found Stripe customer", { customerId, hasSubscriptions: customer.subscriptions?.data?.length > 0 });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const returnUrl = `${origin}/bank?tab=pawclub`;
    
    // Check if we're in test mode
    const isTestMode = stripeKey.startsWith('sk_test_');
    logStep("Detected Stripe mode", { isTestMode });
    
    try {
      // Try to create portal session directly first
      logStep("Attempting to create portal session directly");
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      logStep("Portal session created successfully", { sessionId: portalSession.id });

      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (portalError: any) {
      logStep("Portal creation failed, analyzing error", { 
        error: portalError.message,
        type: portalError.type,
        code: portalError.code 
      });
      
      // Handle configuration-related errors
      if (portalError.message?.includes("configuration") || 
          portalError.message?.includes("features") ||
          portalError.message?.includes("default configuration") ||
          portalError.code === "resource_missing") {
        
        if (isTestMode) {
          logStep("Test mode - attempting to create minimal configuration");
          
          try {
            // Create a minimal configuration for test mode
            const configuration = await stripe.billingPortal.configurations.create({
              business_profile: {
                headline: "Manage your PawClub subscription",
              },
              features: {
                payment_method_update: { enabled: true },
                subscription_cancel: { 
                  enabled: true,
                  mode: "at_period_end"
                },
                invoice_history: { enabled: true },
              },
            });
            logStep("Created minimal portal configuration", { configId: configuration.id });

            // Create portal session with new configuration
            const portalSession = await stripe.billingPortal.sessions.create({
              customer: customerId,
              configuration: configuration.id,
              return_url: returnUrl,
            });
            logStep("Portal session created with new config", { sessionId: portalSession.id });

            return new Response(JSON.stringify({ url: portalSession.url }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          } catch (configError: any) {
            logStep("Failed to create test configuration", { error: configError.message });
            return new Response(JSON.stringify({ 
              code: "TEST_CONFIG_FAILED",
              error: configError.message 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            });
          }
        } else {
          // Live mode - user needs to configure in Stripe dashboard
          logStep("Live mode requires manual configuration");
          return new Response(JSON.stringify({ 
            code: "LIVE_CONFIG_REQUIRED",
            error: "Your Stripe account is in live mode and requires Customer Portal configuration. Please visit your Stripe dashboard to set up the Customer Portal.",
            dashboardUrl: "https://dashboard.stripe.com/settings/billing/portal"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
      } else if (portalError.message?.includes("No such customer")) {
        return new Response(JSON.stringify({ 
          code: "CUSTOMER_INVALID",
          error: "Customer record is invalid or corrupted" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      } else {
        // Other Stripe errors
        return new Response(JSON.stringify({ 
          code: "STRIPE_API_ERROR",
          error: portalError.message 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("FINAL ERROR in customer-portal", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      code: "INTERNAL_ERROR",
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
