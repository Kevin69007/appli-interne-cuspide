
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 payment creations per 5 minutes

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function validatePaymentInput(amount: number, priceInCents: number): { isValid: boolean; error?: string } {
  // Validate amount
  if (!amount || typeof amount !== 'number') {
    return { isValid: false, error: "Amount must be a valid number" };
  }
  
  if (amount < 100 || amount > 50000) {
    return { isValid: false, error: "Amount must be between 100 and 50,000 Paw Dollars" };
  }
  
  // Validate price - Updated to handle discounted prices
  if (!priceInCents || typeof priceInCents !== 'number') {
    return { isValid: false, error: "Price must be a valid number" };
  }
  
  // Updated minimum price to handle 20% discount (was 499, now 399 for $3.99)
  if (priceInCents < 399 || priceInCents > 99999) {
    return { isValid: false, error: "Price must be between $3.99 and $999.99" };
  }
  
  // Validate reasonable price per paw dollar ratio (prevent manipulation)
  const pricePerPawDollar = priceInCents / amount;
  if (pricePerPawDollar < 1.5 || pricePerPawDollar > 50) {
    return { isValid: false, error: "Invalid price to Paw Dollar ratio" };
  }
  
  return { isValid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const requestBody = await req.json().catch(() => null);
    if (!requestBody) {
      return new Response(JSON.stringify({ 
        error: "Invalid request body",
        details: "Request body must be valid JSON"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { amount, priceInCents } = requestBody;
    
    console.log(`🏦 Create Payment Request:`, { amount, priceInCents });

    // Input validation
    const validation = validatePaymentInput(amount, priceInCents);
    if (!validation.isValid) {
      console.error("❌ Input validation failed:", validation.error);
      return new Response(JSON.stringify({ 
        error: validation.error,
        details: "Please check your payment amount and try again"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user from request headers - CRITICAL SECURITY CHECK
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header");
      return new Response(JSON.stringify({ 
        error: "Authentication required",
        details: "Please sign in to make a purchase"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("❌ Authentication failed:", authError);
      return new Response(JSON.stringify({ 
        error: "Invalid authentication",
        details: "Please sign in again to make a purchase"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log(`👤 Authenticated user: ${user.id} (${user.email})`);

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      console.error("❌ Rate limit exceeded for user:", user.id);
      return new Response(JSON.stringify({ 
        error: "Too many payment requests",
        details: "Please wait a few minutes before creating another payment"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    console.log(`💰 Creating payment session for user ${user.id}: ${amount} Paw Dollars for $${(priceInCents / 100).toFixed(2)}`);

    // Initialize Stripe with validation
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("❌ Stripe secret key not found in environment variables");
      return new Response(JSON.stringify({ 
        error: "Payment system configuration error",
        details: "Payment processing is temporarily unavailable"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get the origin for redirect URLs with validation
    const origin = req.headers.get("origin");
    if (!origin) {
      console.error("❌ No origin header found");
      return new Response(JSON.stringify({ 
        error: "Invalid request origin",
        details: "Request must include valid origin"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Create idempotency key based on user and amount to prevent duplicate sessions
    const idempotencyKey = `${user.id}-${amount}-${priceInCents}-${Date.now()}`;
    
    console.log(`🔒 CRITICAL: Creating Stripe session - NO PD CREDITS WILL BE ISSUED UNTIL PAYMENT IS CONFIRMED`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${amount} Paw Dollars`,
              description: `Purchase ${amount} Paw Dollars for your virtual pets`,
              images: [],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/bank?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/bank?canceled=true`,
      metadata: {
        user_id: user.id,
        paw_dollars: amount.toString(),
        timestamp: new Date().toISOString(),
        expected_amount: priceInCents.toString(),
      },
      customer_email: user.email,
      billing_address_collection: "auto",
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          paw_dollars: amount.toString(),
          expected_amount: priceInCents.toString(),
        }
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    }, {
      idempotencyKey: idempotencyKey
    });

    console.log(`✅ Payment session created successfully:`, {
      sessionId: session.id,
      amount: amount,
      priceInCents: priceInCents,
      userId: user.id,
      idempotencyKey: idempotencyKey
    });

    // Initialize Supabase with service role key for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // CRITICAL: Create a tracking record but ABSOLUTELY NO CREDITS YET
    console.log(`💾 Creating TRACKING-ONLY record for session: ${session.id} - ZERO CREDITS ISSUED`);
    
    const { data: stripePaymentRecord, error: stripePaymentError } = await supabaseService
      .from("stripe_payments")
      .insert({
        stripe_session_id: session.id,
        user_id: user.id,
        amount_cents: priceInCents,
        paw_dollars: amount,
        status: 'pending', // CRITICAL: pending until payment confirmed by Stripe
        browser_verified: false,
        paw_dollars_credited: false, // CRITICAL: NO CREDITS until payment confirmed
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (stripePaymentError) {
      console.error("❌ Failed to create stripe_payments record:", stripePaymentError);
      console.log("⚠️ Stripe payments record failed - verification may have issues");
    } else {
      console.log(`✅ TRACKING-ONLY record created: ${stripePaymentRecord.id} - ABSOLUTELY NO CREDITS ISSUED`);
    }

    console.log(`🚫 SECURITY CONFIRMATION: NO PAW DOLLARS CREDITED - User must complete payment and verification`);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("❌ Payment creation error:", error);
    
    // Don't expose internal error details
    return new Response(JSON.stringify({ 
      error: "Payment session creation failed",
      details: "Please try again or contact support if the issue persists"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
