
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(userAgent: string, ip: string): boolean {
  const key = `${userAgent}-${ip}`;
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function validateInput(sessionId: string): { isValid: boolean; error?: string } {
  if (!sessionId) {
    return { isValid: false, error: "Session ID is required" };
  }
  
  if (typeof sessionId !== 'string') {
    return { isValid: false, error: "Session ID must be a string" };
  }
  
  if (sessionId.length < 10 || sessionId.length > 200) {
    return { isValid: false, error: "Invalid session ID format" };
  }
  
  // Basic pattern validation for Stripe session IDs
  if (!sessionId.startsWith('cs_')) {
    return { isValid: false, error: "Invalid session ID format" };
  }
  
  return { isValid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const userAgent = req.headers.get("user-agent") || "unknown";
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0] : "unknown";
    
    if (!checkRateLimit(userAgent, ip)) {
      console.error("❌ [VERIFY-PAYMENT] Rate limit exceeded for:", { userAgent, ip });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Too many requests. Please try again later." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // Parse and validate request body
    const requestBody = await req.json().catch(() => null);
    if (!requestBody) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid request body" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { sessionId } = requestBody;
    
    console.log(`🔍 [VERIFY-PAYMENT] STRICT VERIFICATION START - Session: ${sessionId}`);

    // Input validation
    const validation = validateInput(sessionId);
    if (!validation.isValid) {
      console.error("❌ [VERIFY-PAYMENT] Input validation failed:", validation.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: validation.error 
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
      console.error("❌ [VERIFY-PAYMENT] No authorization header");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Authentication required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("❌ [VERIFY-PAYMENT] Authentication failed:", authError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid authentication token" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log(`👤 [VERIFY-PAYMENT] Authenticated user: ${user.id} (${user.email})`);

    // Initialize Stripe with validation
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("❌ [VERIFY-PAYMENT] Stripe key not configured");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment system configuration error" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // STEP 1: RETRIEVE SESSION FROM STRIPE AND VERIFY PAYMENT STATUS
    console.log(`🔒 [VERIFY-PAYMENT] STEP 1: Retrieving session from Stripe to verify payment`);
    
    let session;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 [VERIFY-PAYMENT] Attempt ${retryCount + 1} to retrieve Stripe session`);
        session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log(`✅ [VERIFY-PAYMENT] Successfully retrieved session on attempt ${retryCount + 1}`);
        break;
      } catch (error: any) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error(`❌ [VERIFY-PAYMENT] Failed to retrieve session after ${maxRetries} attempts:`, error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Payment verification temporarily unavailable" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 503,
          });
        }
        console.log(`⚠️ [VERIFY-PAYMENT] Retry ${retryCount} for session retrieval in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`💳 [VERIFY-PAYMENT] STRIPE SESSION STATUS CHECK:`, {
      payment_status: session.payment_status,
      session_status: session.status,
      amount_total: session.amount_total,
      session_id: session.id
    });

    // STEP 2: CRITICAL PAYMENT VERIFICATION - ONLY PROCEED IF PAYMENT IS ACTUALLY COMPLETED
    console.log(`🔐 [VERIFY-PAYMENT] STEP 2: CRITICAL PAYMENT STATUS VERIFICATION`);
    
    if (session.payment_status !== 'paid') {
      console.log(`❌ [VERIFY-PAYMENT] PAYMENT NOT PAID - Status: ${session.payment_status}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Payment not completed. Payment status: ${session.payment_status}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (session.status !== 'complete') {
      console.log(`❌ [VERIFY-PAYMENT] SESSION NOT COMPLETE - Status: ${session.status}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Payment session not complete. Session status: ${session.status}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`🎉 [VERIFY-PAYMENT] PAYMENT VERIFIED BY STRIPE - Both payment_status=paid AND status=complete`);

    // STEP 3: EXTRACT AND VALIDATE METADATA
    const sessionUserId = session.metadata?.user_id;
    const pawDollarsStr = session.metadata?.paw_dollars;
    const pawDollars = pawDollarsStr ? parseInt(pawDollarsStr, 10) : 0;
    
    if (!sessionUserId || !pawDollars || isNaN(pawDollars)) {
      console.error("❌ [VERIFY-PAYMENT] Invalid session metadata:", { sessionUserId, pawDollars, metadata: session.metadata });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid payment session data" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // STEP 4: VERIFY USER OWNERSHIP OF THE PAYMENT
    if (sessionUserId !== user.id) {
      console.error("❌ [VERIFY-PAYMENT] User mismatch - potential fraud attempt:", { authenticated: user.id, payment: sessionUserId });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Unauthorized access to payment verification" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // STEP 5: VALIDATE PAW DOLLARS AMOUNT
    if (pawDollars < 1 || pawDollars > 50000) {
      console.error("❌ [VERIFY-PAYMENT] Suspicious paw dollars amount:", pawDollars);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid payment amount" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`✅ [VERIFY-PAYMENT] ALL VERIFICATIONS PASSED - Payment confirmed by Stripe for user ${user.id}: ${pawDollars} Paw Dollars`);

    // STEP 6: CHECK DATABASE RECORDS AND PREVENT DOUBLE CREDITING
    console.log(`🔍 [VERIFY-PAYMENT] STEP 6: Checking for existing payment records to prevent double crediting`);
    
    let { data: existingPayment, error: paymentSelectError } = await supabaseService
      .from("stripe_payments")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();

    if (paymentSelectError && paymentSelectError.code !== 'PGRST116') {
      console.error("❌ [VERIFY-PAYMENT] Error checking existing payment:", paymentSelectError);
      throw new Error("Database error checking payment status");
    }

    // STEP 7: CHECK IF ALREADY CREDITED TO PREVENT DOUBLE SPENDING
    if (existingPayment?.paw_dollars_credited) {
      console.log("💰 [VERIFY-PAYMENT] PAYMENT ALREADY PROCESSED AND CREDITED - No action needed");
      
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment already processed",
        alreadyProcessed: true,
        pawDollarsAdded: pawDollars,
        newTotal: profile?.paw_dollars || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // STEP 8: CREATE OR UPDATE PAYMENT RECORD
    if (!existingPayment) {
      console.log("📝 [VERIFY-PAYMENT] Creating payment record for Stripe-confirmed payment");
      const { data: newPaymentRecord, error: insertError } = await supabaseService
        .from("stripe_payments")
        .insert({
          stripe_session_id: sessionId,
          user_id: user.id,
          amount_cents: session.amount_total || 0,
          paw_dollars: pawDollars,
          status: 'completed',
          browser_verified: true,
          paw_dollars_credited: false, // Will be set to true by credit function
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ [VERIFY-PAYMENT] Error creating payment record:", insertError);
        throw new Error("Failed to create payment record");
      }
      existingPayment = newPaymentRecord;
      console.log("✅ [VERIFY-PAYMENT] Payment record created successfully");
    } else {
      console.log("📝 [VERIFY-PAYMENT] Updating existing payment record to completed");
      const { error: updateError } = await supabaseService
        .from("stripe_payments")
        .update({
          status: 'completed',
          browser_verified: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingPayment.id);

      if (updateError) {
        console.error("❌ [VERIFY-PAYMENT] Error updating payment record:", updateError);
        throw new Error("Failed to update payment record");
      }
      console.log("✅ [VERIFY-PAYMENT] Payment record updated successfully");
    }

    // STEP 9: FINAL STEP - CREDIT PAW DOLLARS USING SAFE ATOMIC FUNCTION
    console.log(`💰 [VERIFY-PAYMENT] FINAL STEP: STRIPE PAYMENT CONFIRMED - Now crediting ${pawDollars} Paw Dollars using atomic function`);
    
    const { data: creditResult, error: creditError } = await supabaseService.rpc('credit_paw_dollars_safe', {
      payment_id: existingPayment.id,
      user_id_param: user.id,
      paw_dollars_amount: pawDollars
    });

    if (creditError) {
      console.error("❌ [VERIFY-PAYMENT] Credit error:", creditError);
      throw creditError;
    }

    if (creditResult) {
      console.log("🎉 [VERIFY-PAYMENT] SUCCESS: Paw Dollars credited ONLY AFTER Stripe payment confirmation!");
      
      // Update transaction status from pending to completed
      await supabaseService
        .from("paw_dollar_transactions")
        .update({
          status: 'completed'
        })
        .or(`description.ilike.%${sessionId}%,description.ilike.%session: ${sessionId}%`)
        .eq("user_id", user.id);

      // Get updated balance
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();
      
      console.log(`🎊 [VERIFY-PAYMENT] CREDIT SUCCESS CONFIRMED: User ${user.id} credited ${pawDollars} PD ONLY AFTER Stripe verification. New balance: ${profile?.paw_dollars}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Successfully credited ${pawDollars} Paw Dollars after Stripe payment confirmation`,
        pawDollarsAdded: pawDollars,
        newTotal: profile?.paw_dollars || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.log("⚠️ [VERIFY-PAYMENT] Payment was already credited by another process");
      
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment already processed",
        alreadyProcessed: true,
        pawDollarsAdded: pawDollars,
        newTotal: profile?.paw_dollars || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error: any) {
    console.error("💥 [VERIFY-PAYMENT] CRITICAL ERROR:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Payment verification failed. Please contact support if the issue persists." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
