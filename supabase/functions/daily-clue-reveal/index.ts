import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔍 Revealing daily clue...");

    // Get current session
    const { data: session } = await supabase
      .from("weekly_game_sessions")
      .select("*")
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      console.log("No active game session");
      return new Response(
        JSON.stringify({ success: false, message: "No active session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which clue to reveal (2-4 based on day of week)
    const dayOfWeek = new Date().getDay();
    let clueNumber = 1;
    
    if (dayOfWeek === 2) clueNumber = 2; // Tuesday
    else if (dayOfWeek === 3) clueNumber = 3; // Wednesday
    else if (dayOfWeek === 4) clueNumber = 4; // Thursday

    console.log(`Revealing clue #${clueNumber}`);

    // Get and reveal the clue
    const { data: clue } = await supabase
      .from("game_clues")
      .select("*")
      .eq("session_id", session.id)
      .eq("clue_number", clueNumber)
      .single();

    if (!clue) {
      console.log(`Clue #${clueNumber} not found`);
      return new Response(
        JSON.stringify({ success: false, message: "Clue not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reveal the clue
    await supabase
      .from("game_clues")
      .update({
        is_revealed: true,
        revealed_at: new Date().toISOString(),
      })
      .eq("id", clue.id);

    // Notify all participants
    const { data: participants } = await supabase
      .from("game_participants")
      .select("employee_id")
      .eq("session_id", session.id);

    if (participants) {
      for (const p of participants) {
        await supabase.from("notifications").insert({
          employee_id: p.employee_id,
          titre: "🔍 Nouvel indice révélé !",
          message: `L'indice #${clueNumber} vient d'être dévoilé. Consultez-le et votez pour éliminer les suspects avant minuit.`,
          type: "game_clue_revealed",
          url: "/detente",
        });
      }
    }

    console.log(`✅ Clue #${clueNumber} revealed`);

    return new Response(
      JSON.stringify({
        success: true,
        clue_number: clueNumber,
        clue_text: clue.clue_text,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error revealing clue:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
