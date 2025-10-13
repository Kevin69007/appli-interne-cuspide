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

    console.log("🗳️ Processing daily eliminations...");

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

    // Get current day (1=Monday, 2=Tuesday, etc.)
    const dayOfWeek = new Date().getDay();
    const voteDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Get all elimination votes for today
    const { data: votes } = await supabase
      .from("game_votes")
      .select("*, suspect_employee_id")
      .eq("session_id", session.id)
      .eq("vote_type", "elimination")
      .eq("vote_day", voteDay);

    if (!votes || votes.length === 0) {
      console.log("No votes to process");
      return new Response(
        JSON.stringify({ success: true, eliminated: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count votes per suspect
    const voteCounts: { [key: string]: { count: number; firstVote: string } } = {};
    
    votes.forEach((vote) => {
      if (vote.suspect_employee_id) {
        if (!voteCounts[vote.suspect_employee_id]) {
          voteCounts[vote.suspect_employee_id] = {
            count: 0,
            firstVote: vote.voted_at,
          };
        }
        voteCounts[vote.suspect_employee_id].count++;
        
        // Keep earliest vote for tie-breaking
        if (vote.voted_at < voteCounts[vote.suspect_employee_id].firstVote) {
          voteCounts[vote.suspect_employee_id].firstVote = vote.voted_at;
        }
      }
    });

    // Sort suspects by vote count (descending), then by earliest vote (ascending)
    const sortedSuspects = Object.entries(voteCounts)
      .sort((a, b) => {
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count; // More votes first
        }
        return new Date(a[1].firstVote).getTime() - new Date(b[1].firstVote).getTime(); // Earlier vote wins tie
      })
      .slice(0, 3); // Top 3 most voted

    const eliminatedIds = sortedSuspects.map(([id]) => id);

    if (eliminatedIds.length > 0) {
      // Mark participants as eliminated
      await supabase
        .from("game_participants")
        .update({
          is_eliminated: true,
          elimination_date: new Date().toISOString(),
        })
        .in("employee_id", eliminatedIds)
        .eq("session_id", session.id);

      console.log(`✅ Eliminated ${eliminatedIds.length} suspects`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eliminated: eliminatedIds,
        vote_counts: voteCounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error processing eliminations:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
