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

    console.log("🎯 Drawing target for the week...");

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from("weekly_game_sessions")
      .select("*")
      .eq("status", "registration_open")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.log("No active registration session found");
      return new Response(
        JSON.stringify({ success: false, message: "No active session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from("game_participants")
      .select("*, employees(*)")
      .eq("session_id", session.id);

    if (participantsError) throw participantsError;

    if (!participants || participants.length === 0) {
      console.log("No participants registered");
      return new Response(
        JSON.stringify({ success: false, message: "No participants" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Random draw for target
    const targetIndex = Math.floor(Math.random() * participants.length);
    const target = participants[targetIndex];

    console.log(`🎯 Target selected: ${target.employees?.nom}`);

    // Update session with target
    await supabase
      .from("weekly_game_sessions")
      .update({
        target_employee_id: target.employee_id,
        status: "waiting_anecdote",
      })
      .eq("id", session.id);

    // Update participant roles
    await supabase
      .from("game_participants")
      .update({ role: "target" })
      .eq("id", target.id);

    const investigators = participants.filter((p) => p.id !== target.id);
    if (investigators.length > 0) {
      await supabase
        .from("game_participants")
        .update({ role: "investigator" })
        .in("id", investigators.map((i) => i.id));
    }

    // Send notification to target
    await supabase.from("notifications").insert({
      employee_id: target.employee_id,
      titre: "🎯 Chut, tu es la Cible !",
      message:
        "Cette semaine, tu es la Cible ! Tu dois écrire une anecdote et préparer 5 indices avant 14h. Ton anecdote et tes indices seront notés par les enquêteurs.",
      type: "game_target_assigned",
      url: "/detente",
    });

    // Send notifications to investigators
    for (const investigator of investigators) {
      await supabase.from("notifications").insert({
        employee_id: investigator.employee_id,
        titre: "🕵️ Tu es Enquêteur !",
        message:
          "Tu fais partie des Enquêteurs cette semaine ! Analyse l'anecdote et les indices pour trouver la Cible.",
        type: "game_investigator_assigned",
        url: "/detente",
      });
    }

    console.log(`✅ Roles assigned: 1 target, ${investigators.length} investigators`);

    return new Response(
      JSON.stringify({
        success: true,
        target_id: target.employee_id,
        investigators_count: investigators.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error drawing target:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
