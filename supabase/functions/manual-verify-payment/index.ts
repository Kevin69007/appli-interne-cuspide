
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sessionId } = await req.json();
    
    console.log(`🔍 [MANUAL-VERIFY] Action: ${action}, SessionId: ${sessionId?.slice(-12) || 'none'}`);

    // Initialize Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get authenticated user if available
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    if (action === 'find_completed_sessions') {
      if (!user) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Authentication required" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      console.log(`🔍 [MANUAL-VERIFY] Finding completed sessions for user: ${user.id}`);

      const completedSessions = [];
      let debugInfo = {
        userEmail: user.email,
        customersFound: 0,
        pendingInDatabase: 0,
        userIdMatched: user.id
      };

      // 1. Check for pending payments in database that are actually completed in Stripe
      console.log(`📋 [MANUAL-VERIFY] Checking database for pending payments`);
      
      const { data: pendingPayments } = await supabaseService
        .from("stripe_payments")
        .select("*")
        .eq("user_id", user.id)
        .eq("paw_dollars_credited", false)
        .in("status", ["pending", "completed"]);

      debugInfo.pendingInDatabase = pendingPayments?.length || 0;

      if (pendingPayments) {
        for (const payment of pendingPayments) {
          try {
            console.log(`🔍 [MANUAL-VERIFY] Verifying Stripe session: ${payment.stripe_session_id}`);
            
            // Get session from Stripe and verify it's actually completed AND paid
            const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
            
            console.log(`💳 [MANUAL-VERIFY] Stripe session status check:`, {
              sessionId: session.id.slice(-12),
              payment_status: session.payment_status,
              session_status: session.status,
              amount_total: session.amount_total
            });

            // CRITICAL: Only include sessions that are both completed AND paid
            if (session.payment_status === 'paid' && session.status === 'complete') {
              console.log(`✅ [MANUAL-VERIFY] Session verified as PAID and COMPLETE - adding to recovery list`);
              
              completedSessions.push({
                sessionId: payment.stripe_session_id,
                amount: payment.amount_cents,
                pawDollars: payment.paw_dollars,
                created: Math.floor(new Date(payment.created_at).getTime() / 1000),
                source: 'database'
              });
            } else {
              console.log(`❌ [MANUAL-VERIFY] Session NOT completed/paid - Status: ${session.payment_status}/${session.status} - SKIPPING`);
            }
          } catch (error) {
            console.error(`❌ [MANUAL-VERIFY] Error checking session ${payment.stripe_session_id}:`, error);
          }
        }
      }

      // 2. Check Stripe directly for recent completed sessions
      console.log(`🔍 [MANUAL-VERIFY] Checking Stripe for recent completed sessions`);
      
      try {
        const customers = await stripe.customers.list({ 
          email: user.email, 
          limit: 10 
        });
        
        debugInfo.customersFound = customers.data.length;

        for (const customer of customers.data) {
          // Get recent checkout sessions for this customer
          const sessions = await stripe.checkout.sessions.list({
            customer: customer.id,
            limit: 20,
            created: {
              gte: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000) // Last 7 days
            }
          });

          for (const session of sessions.data) {
            console.log(`💳 [MANUAL-VERIFY] Checking Stripe session directly:`, {
              sessionId: session.id.slice(-12),
              payment_status: session.payment_status,
              session_status: session.status,
              amount_total: session.amount_total,
              metadata: session.metadata
            });

            // CRITICAL: Only process sessions that are both completed AND paid
            if (session.payment_status === 'paid' && session.status === 'complete') {
              // Check if we already have this session in our database
              const { data: existingPayment } = await supabaseService
                .from("stripe_payments")
                .select("paw_dollars_credited")
                .eq("stripe_session_id", session.id)
                .single();

              // Only add if not already credited
              if (!existingPayment?.paw_dollars_credited) {
                const pawDollars = parseInt(session.metadata?.paw_dollars || '0', 10);
                
                console.log(`✅ [MANUAL-VERIFY] Found PAID and COMPLETE Stripe session not yet credited: ${session.id.slice(-12)}`);
                
                if (pawDollars > 0) {
                  completedSessions.push({
                    sessionId: session.id,
                    amount: session.amount_total || 0,
                    pawDollars: pawDollars,
                    created: session.created,
                    source: 'stripe'
                  });
                }
              } else {
                console.log(`⚠️ [MANUAL-VERIFY] Session already credited: ${session.id.slice(-12)}`);
              }
            } else {
              console.log(`❌ [MANUAL-VERIFY] Session NOT paid/complete - Status: ${session.payment_status}/${session.status} - SKIPPING`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ [MANUAL-VERIFY] Error checking Stripe directly:`, error);
      }

      // Get current balance
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();

      console.log(`📊 [MANUAL-VERIFY] Search complete - Found ${completedSessions.length} VERIFIED completed sessions`);

      return new Response(JSON.stringify({
        success: true,
        completedSessions: completedSessions,
        currentBalance: profile?.paw_dollars || 0,
        debugInfo: debugInfo
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'process_session') {
      if (!sessionId || !user) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Missing session ID or authentication" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      console.log(`💰 [MANUAL-VERIFY] Processing session: ${sessionId.slice(-12)}`);

      // CRITICAL: Verify with Stripe that this session is actually completed and paid
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
        
        console.log(`🔒 [MANUAL-VERIFY] CRITICAL VERIFICATION - Stripe session status:`, {
          sessionId: session.id.slice(-12),
          payment_status: session.payment_status,
          session_status: session.status,
          amount_total: session.amount_total
        });

        // ABSOLUTE REQUIREMENT: Both payment_status must be 'paid' AND status must be 'complete'
        if (session.payment_status !== 'paid') {
          console.log(`❌ [MANUAL-VERIFY] PAYMENT NOT PAID - Status: ${session.payment_status} - BLOCKING CREDIT`);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Payment not completed. Payment status: ${session.payment_status}`,
            result: { error: `Payment status is ${session.payment_status}, not paid` }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        if (session.status !== 'complete') {
          console.log(`❌ [MANUAL-VERIFY] SESSION NOT COMPLETE - Status: ${session.status} - BLOCKING CREDIT`);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Payment session not complete. Session status: ${session.status}`,
            result: { error: `Session status is ${session.status}, not complete` }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        console.log(`🎉 [MANUAL-VERIFY] STRIPE VERIFICATION PASSED - Session is PAID and COMPLETE`);

      } catch (error) {
        console.error(`❌ [MANUAL-VERIFY] Error verifying with Stripe:`, error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to verify payment with Stripe",
          result: { error: error instanceof Error ? error.message : String(error) }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      // Extract and validate metadata
      const sessionUserId = session.metadata?.user_id;
      const pawDollarsStr = session.metadata?.paw_dollars;
      const pawDollars = pawDollarsStr ? parseInt(pawDollarsStr, 10) : 0;

      if (!sessionUserId || !pawDollars || isNaN(pawDollars)) {
        console.error(`❌ [MANUAL-VERIFY] Invalid session metadata:`, { sessionUserId, pawDollars, metadata: session.metadata });
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Invalid payment session data",
          result: { error: "Invalid session metadata" }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Verify user ownership
      if (sessionUserId !== user.id) {
        console.error(`❌ [MANUAL-VERIFY] User mismatch - potential fraud:`, { authenticated: user.id, payment: sessionUserId });
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Unauthorized access to payment verification",
          result: { error: "User mismatch" }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      // Check for existing payment record and credit status
      let { data: existingPayment, error: paymentSelectError } = await supabaseService
        .from("stripe_payments")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();

      if (paymentSelectError && paymentSelectError.code !== 'PGRST116') {
        console.error(`❌ [MANUAL-VERIFY] Error checking existing payment:`, paymentSelectError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Database error checking payment status",
          result: { error: paymentSelectError.message }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      // Check if already credited
      if (existingPayment?.paw_dollars_credited) {
        console.log(`⚠️ [MANUAL-VERIFY] Payment already processed and credited`);
        
        const { data: profile } = await supabaseService
          .from("profiles")
          .select("paw_dollars")
          .eq("id", user.id)
          .single();

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Payment already processed",
          result: {
            alreadyProcessed: true,
            pawDollarsAdded: pawDollars,
            newTotal: profile?.paw_dollars || 0
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Create or update payment record
      if (!existingPayment) {
        console.log(`📝 [MANUAL-VERIFY] Creating payment record for Stripe-verified payment`);
        
        const { data: newPaymentRecord, error: insertError } = await supabaseService
          .from("stripe_payments")
          .insert({
            stripe_session_id: sessionId,
            user_id: user.id,
            amount_cents: session.amount_total || 0,
            paw_dollars: pawDollars,
            status: 'completed',
            browser_verified: true,
            paw_dollars_credited: false,
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ [MANUAL-VERIFY] Error creating payment record:`, insertError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Failed to create payment record",
            result: { error: insertError.message }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
        
        existingPayment = newPaymentRecord;
      } else {
        console.log(`📝 [MANUAL-VERIFY] Updating existing payment record to completed`);
        
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
          console.error(`❌ [MANUAL-VERIFY] Error updating payment record:`, updateError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Failed to update payment record",
            result: { error: updateError.message }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
      }

      // FINAL STEP: Credit Paw Dollars using safe atomic function
      console.log(`💰 [MANUAL-VERIFY] FINAL STEP: STRIPE PAYMENT VERIFIED - Now crediting ${pawDollars} Paw Dollars`);
      
      const { data: creditResult, error: creditError } = await supabaseService.rpc('credit_paw_dollars_safe', {
        payment_id: existingPayment.id,
        user_id_param: user.id,
        paw_dollars_amount: pawDollars
      });

      if (creditError) {
        console.error(`❌ [MANUAL-VERIFY] Credit error:`, creditError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to credit Paw Dollars",
          result: { error: creditError.message }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      if (creditResult) {
        console.log(`🎉 [MANUAL-VERIFY] SUCCESS: Paw Dollars credited ONLY AFTER Stripe verification!`);
        
        // Get updated balance
        const { data: profile } = await supabaseService
          .from("profiles")
          .select("paw_dollars")
          .eq("id", user.id)
          .single();
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Successfully credited ${pawDollars} Paw Dollars after Stripe verification`,
          result: {
            pawDollarsAdded: pawDollars,
            newTotal: profile?.paw_dollars || 0
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        console.log(`⚠️ [MANUAL-VERIFY] Payment was already credited by another process`);
        
        const { data: profile } = await supabaseService
          .from("profiles")
          .select("paw_dollars")
          .eq("id", user.id)
          .single();

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Payment already processed",
          result: {
            alreadyProcessed: true,
            pawDollarsAdded: pawDollars,
            newTotal: profile?.paw_dollars || 0
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    if (action === 'process_pending') {
      if (!user) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Authentication required" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      console.log(`🔄 [MANUAL-VERIFY] Processing all pending payments for user: ${user.id}`);

      // Get all pending payments
      const { data: pendingPayments } = await supabaseService
        .from("stripe_payments")
        .select("*")
        .eq("user_id", user.id)
        .eq("paw_dollars_credited", false);

      if (!pendingPayments || pendingPayments.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          processedCount: 0,
          totalCredits: 0,
          message: "No pending payments found"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      let processedCount = 0;
      let totalCredits = 0;

      for (const payment of pendingPayments) {
        try {
          console.log(`🔍 [MANUAL-VERIFY] Checking pending payment: ${payment.stripe_session_id.slice(-12)}`);
          
          // Verify with Stripe that this session is completed and paid
          const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
          
          console.log(`💳 [MANUAL-VERIFY] Stripe verification for pending payment:`, {
            sessionId: session.id.slice(-12),
            payment_status: session.payment_status,
            session_status: session.status
          });

          // CRITICAL: Only process if both payment_status is 'paid' AND status is 'complete'
          if (session.payment_status === 'paid' && session.status === 'complete') {
            console.log(`✅ [MANUAL-VERIFY] Pending payment verified as PAID and COMPLETE - processing`);
            
            const { data: creditResult } = await supabaseService.rpc('credit_paw_dollars_safe', {
              payment_id: payment.id,
              user_id_param: user.id,
              paw_dollars_amount: payment.paw_dollars
            });

            if (creditResult) {
              processedCount++;
              totalCredits += payment.paw_dollars;
              console.log(`💰 [MANUAL-VERIFY] Successfully credited ${payment.paw_dollars} PD for session ${payment.stripe_session_id.slice(-12)}`);
            }
          } else {
            console.log(`❌ [MANUAL-VERIFY] Pending payment NOT completed/paid - Status: ${session.payment_status}/${session.status} - SKIPPING`);
          }
        } catch (error) {
          console.error(`❌ [MANUAL-VERIFY] Error processing pending payment ${payment.stripe_session_id}:`, error);
        }
      }

      console.log(`🎊 [MANUAL-VERIFY] Processed ${processedCount} pending payments, credited ${totalCredits} total PD`);

      return new Response(JSON.stringify({
        success: true,
        processedCount: processedCount,
        totalCredits: totalCredits,
        message: `Successfully processed ${processedCount} pending payment(s)`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Invalid action specified" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    console.error(`💥 [MANUAL-VERIFY] CRITICAL ERROR:`, error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Payment verification failed. Please contact support if the issue persists." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
