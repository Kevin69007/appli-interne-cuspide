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

    console.log("📖 Revealing anecdote...");

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from("weekly_game_sessions")
      .select("*")
      .eq("status", "waiting_anecdote")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.log("No session waiting for anecdote");
      return new Response(
        JSON.stringify({ success: false, message: "No active session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if anecdote was submitted
    if (!session.anecdote || session.anecdote.trim() === "") {
      console.log("⚠️ No anecdote submitted - applying penalty");

      // Get penalty configuration
      const { data: penaltyConfig } = await supabase
        .from("game_rewards_config")
        .select("points_amount")
        .eq("config_type", "target_no_submission_penalty")
        .eq("is_active", true)
        .single();

      const penaltyPoints = penaltyConfig?.points_amount || -50;

      // Apply penalty to target
      const { data: existingStats } = await supabase
        .from("game_player_stats")
        .select("*")
        .eq("employee_id", session.target_employee_id)
        .single();

      if (existingStats) {
        await supabase
          .from("game_player_stats")
          .update({
            total_points: existingStats.total_points + penaltyPoints,
          })
          .eq("employee_id", session.target_employee_id);
      } else {
        await supabase.from("game_player_stats").insert({
          employee_id: session.target_employee_id,
          total_points: penaltyPoints,
        });
      }

      // Update session status
      await supabase
        .from("weekly_game_sessions")
        .update({ status: "cancelled_no_anecdote" })
        .eq("id", session.id);

      // Create global communication
      await supabase.from("communications").insert({
        titre: "😞 Pas de jeu cette semaine",
        contenu:
          "Pas de fun pour l'équipe cette semaine, la cible n'a pas répondu à temps, motivez vos collègues pour qu'on finisse pas tous dépressifs !",
        type_destinataire: "tout_le_monde",
        require_confirmation: false,
        show_in_calendar: false,
        created_by: null,
      });

      // Notify all participants
      const { data: participants } = await supabase
        .from("game_participants")
        .select("employee_id")
        .eq("session_id", session.id);

      if (participants) {
        for (const p of participants) {
          await supabase.from("notifications").insert({
            employee_id: p.employee_id,
            titre: "😞 Jeu annulé",
            message:
              "La Cible n'a pas soumis d'anecdote. Pas de jeu cette semaine !",
            type: "game_cancelled",
            url: "/detente",
          });
        }
      }

      // Notify target of penalty
      await supabase.from("notifications").insert({
        employee_id: session.target_employee_id,
        titre: "⚠️ Pénalité appliquée",
        message: `Vous n'avez pas soumis d'anecdote à temps. Pénalité : ${penaltyPoints} points`,
        type: "game_penalty",
        url: "/detente",
      });

      console.log(`❌ Game cancelled - Penalty applied: ${penaltyPoints} points`);

      return new Response(
        JSON.stringify({
          success: true,
          cancelled: true,
          penalty_applied: penaltyPoints,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Anecdote was submitted - proceed normally
    console.log("✅ Anecdote submitted, proceeding with game");

    // Update session status
    await supabase
      .from("weekly_game_sessions")
      .update({ status: "in_progress" })
      .eq("id", session.id);

    // Reveal first clue
    const { data: firstClue } = await supabase
      .from("game_clues")
      .select("*")
      .eq("session_id", session.id)
      .eq("clue_number", 1)
      .single();

    if (firstClue) {
      await supabase
        .from("game_clues")
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
        })
        .eq("id", firstClue.id);
    }

    // Create communication with anecdote
    await supabase.from("communications").insert({
      titre: "📖 Une révélation inattendue...",
      contenu: `Saurez-vous découvrir l'auteur de cette histoire ?\n\n"${session.anecdote}"\n\nRendez-vous chaque jour dans l'espace Détente pour jouer les détectives !`,
      type_destinataire: "tout_le_monde",
      require_confirmation: false,
      show_in_calendar: false,
      created_by: null,
    });

    // Notify all participants
    const { data: participants } = await supabase
      .from("game_participants")
      .select("employee_id")
      .eq("session_id", session.id);

    if (participants) {
      for (const p of participants) {
        await supabase.from("notifications").insert({
          employee_id: p.employee_id,
          titre: "📖 L'anecdote est révélée !",
          message: "L'enquête commence ! Consultez l'anecdote dans l'espace Détente.",
          type: "game_anecdote_revealed",
          url: "/detente",
        });
      }
    }

    console.log("✅ Anecdote revealed and first clue published");

    return new Response(
      JSON.stringify({
        success: true,
        status: "in_progress",
        first_clue_revealed: !!firstClue,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error revealing anecdote:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
