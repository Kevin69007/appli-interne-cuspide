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

    console.log("🎉 Processing final vote and revealing target...");

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

    // Reveal last clue (clue 5)
    const { data: lastClue } = await supabase
      .from("game_clues")
      .select("*")
      .eq("session_id", session.id)
      .eq("clue_number", 5)
      .single();

    if (lastClue && !lastClue.is_revealed) {
      await supabase
        .from("game_clues")
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
        })
        .eq("id", lastClue.id);
    }

    // Get final votes
    const { data: finalVotes } = await supabase
      .from("game_votes")
      .select("*")
      .eq("session_id", session.id)
      .eq("vote_type", "final_suspect");

    // Count votes
    const voteCounts: { [key: string]: number } = {};
    finalVotes?.forEach((vote) => {
      if (vote.suspect_employee_id) {
        voteCounts[vote.suspect_employee_id] =
          (voteCounts[vote.suspect_employee_id] || 0) + 1;
      }
    });

    // Get most voted suspect
    const mostVoted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
    const investigatorsFoundTarget =
      mostVoted && mostVoted[0] === session.target_employee_id;

    // Calculate anecdote originality score
    const { data: originalityVotes } = await supabase
      .from("game_votes")
      .select("originality_rating")
      .eq("session_id", session.id)
      .eq("vote_type", "anecdote_originality");

    const avgOriginality = originalityVotes && originalityVotes.length > 0
      ? originalityVotes.reduce((sum, v) => sum + (v.originality_rating || 0), 0) / originalityVotes.length
      : 0;

    await supabase
      .from("weekly_game_sessions")
      .update({ anecdote_originality_score: avgOriginality })
      .eq("id", session.id);

    // Calculate difficulty scores for each clue
    const { data: allClues } = await supabase
      .from("game_clues")
      .select("*")
      .eq("session_id", session.id);

    if (allClues) {
      for (const clue of allClues) {
        const { data: difficultyVotes } = await supabase
          .from("game_votes")
          .select("difficulty_rating")
          .eq("clue_id", clue.id)
          .eq("vote_type", "clue_difficulty");

        const avgDifficulty = difficultyVotes && difficultyVotes.length > 0
          ? difficultyVotes.reduce((sum, v) => sum + (v.difficulty_rating || 0), 0) / difficultyVotes.length
          : 0;

        await supabase
          .from("game_clues")
          .update({ difficulty_score: avgDifficulty })
          .eq("id", clue.id);
      }
    }

    // Get reward configuration
    const { data: rewards } = await supabase
      .from("game_rewards_config")
      .select("*")
      .eq("is_active", true);

    const rewardMap: { [key: string]: number } = {};
    rewards?.forEach((r) => {
      rewardMap[r.config_type] = r.points_amount;
    });

    // Calculate points
    let targetPoints = 0;
    let investigatorPoints = 0;

    if (investigatorsFoundTarget) {
      // Investigators win
      investigatorPoints = rewardMap["investigator_win"] || 50;
    } else {
      // Target wins
      targetPoints = rewardMap["target_win"] || 100;

      // Add anecdote bonus
      if (avgOriginality >= 4) {
        targetPoints += rewardMap["anecdote_bonus"] || 30;
      }

      // Add/subtract clue difficulty points
      const avgClueScore = allClues && allClues.length > 0
        ? allClues.reduce((sum, c) => sum + (c.difficulty_score || 0), 0) / allClues.length
        : 0;

      if (avgClueScore >= 4) {
        targetPoints += (rewardMap["clue_bonus"] || 10) * (allClues?.length || 0);
      } else if (avgClueScore <= 2) {
        targetPoints += (rewardMap["clue_penalty"] || -5) * (allClues?.length || 0);
      }
    }

    // Update player stats
    const { data: targetStats } = await supabase
      .from("game_player_stats")
      .select("*")
      .eq("employee_id", session.target_employee_id)
      .single();

    if (targetStats) {
      await supabase
        .from("game_player_stats")
        .update({
          total_points: targetStats.total_points + targetPoints,
          times_as_target: targetStats.times_as_target + 1,
          times_target_won: investigatorsFoundTarget
            ? targetStats.times_target_won
            : targetStats.times_target_won + 1,
        })
        .eq("employee_id", session.target_employee_id);
    } else {
      await supabase.from("game_player_stats").insert({
        employee_id: session.target_employee_id,
        total_points: targetPoints,
        times_as_target: 1,
        times_target_won: investigatorsFoundTarget ? 0 : 1,
      });
    }

    // Update investigator stats
    const { data: investigators } = await supabase
      .from("game_participants")
      .select("employee_id")
      .eq("session_id", session.id)
      .eq("role", "investigator");

    if (investigators && investigatorsFoundTarget) {
      for (const inv of investigators) {
        const { data: invStats } = await supabase
          .from("game_player_stats")
          .select("*")
          .eq("employee_id", inv.employee_id)
          .single();

        if (invStats) {
          await supabase
            .from("game_player_stats")
            .update({
              total_points: invStats.total_points + investigatorPoints,
              times_investigator_won: invStats.times_investigator_won + 1,
            })
            .eq("employee_id", inv.employee_id);
        } else {
          await supabase.from("game_player_stats").insert({
            employee_id: inv.employee_id,
            total_points: investigatorPoints,
            times_investigator_won: 1,
          });
        }
      }
    }

    // Update session status
    await supabase
      .from("weekly_game_sessions")
      .update({
        status: "finished",
        finished_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    // Get target employee info
    const { data: targetEmployee } = await supabase
      .from("employees")
      .select("nom, prenom")
      .eq("id", session.target_employee_id)
      .single();

    const targetName = targetEmployee
      ? `${targetEmployee.prenom} ${targetEmployee.nom}`
      : "La Cible";

    // Create communication
    const communicationTitle = investigatorsFoundTarget
      ? "🔎 Les Enquêteurs ont trouvé !"
      : "🎉 La Cible a gagné !";

    const communicationContent = investigatorsFoundTarget
      ? `Bien joué aux Enquêteurs ! ${targetName} était bien la Cible cette semaine.\n\nPoints gagnés par enquêteur : ${investigatorPoints}`
      : `${targetName} était la Cible cette semaine et a réussi à déjouer les Enquêteurs ! Bravo pour cette belle anecdote.\n\nPoints gagnés : ${targetPoints}`;

    await supabase.from("communications").insert({
      titre: communicationTitle,
      contenu: communicationContent,
      type_destinataire: "tout_le_monde",
      require_confirmation: false,
      show_in_calendar: false,
      created_by: null,
    });

    // Notify all participants
    const { data: allParticipants } = await supabase
      .from("game_participants")
      .select("employee_id")
      .eq("session_id", session.id);

    if (allParticipants) {
      for (const p of allParticipants) {
        await supabase.from("notifications").insert({
          employee_id: p.employee_id,
          titre: communicationTitle,
          message: `Le jeu est terminé ! ${targetName} était la Cible. Consultez les résultats dans l'espace Détente.`,
          type: "game_finished",
          url: "/detente",
        });
      }
    }

    console.log(`✅ Game finished - Investigators ${investigatorsFoundTarget ? "won" : "lost"}`);

    return new Response(
      JSON.stringify({
        success: true,
        investigators_won: investigatorsFoundTarget,
        target_points: targetPoints,
        investigator_points: investigatorPoints,
        target_name: targetName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in final vote reveal:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
