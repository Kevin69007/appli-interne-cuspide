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

    console.log("🎲 Starting weekly game registration...");

    // Get current week number and year
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const year = now.getFullYear();

    console.log(`Week ${weekNumber}, Year ${year}`);

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from("weekly_game_sessions")
      .select("id")
      .eq("week_number", weekNumber)
      .eq("year", year)
      .single();

    if (existingSession) {
      console.log("Session already exists for this week");
      return new Response(
        JSON.stringify({ success: false, message: "Session already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from("weekly_game_sessions")
      .insert({
        week_number: weekNumber,
        year: year,
        status: "registration_open",
        started_at: now.toISOString(),
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    console.log("✅ Session created:", session.id);

    // Create global communication
    await supabase.from("communications").insert({
      titre: "🎲 Tirage au sort de la Cible !",
      contenu:
        "Préparez-vous, le tirage au sort est ouvert jusqu'à 12h ! Cliquez vite pour participer au tirage de la Cible de la semaine.",
      type_destinataire: "tout_le_monde",
      require_confirmation: false,
      show_in_calendar: false,
      created_by: null,
    });

    // Create notifications for all employees
    const { data: employees } = await supabase.from("employees").select("id");

    if (employees && employees.length > 0) {
      const notifications = employees.map((emp) => ({
        employee_id: emp.id,
        titre: "🎲 Tirage de la Cible",
        message: "Le tirage au sort est ouvert ! Participez avant 12h",
        type: "game_registration",
        url: "/detente",
      }));

      await supabase.from("notifications").insert(notifications);
      console.log(`✅ ${employees.length} notifications sent`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        message: "Weekly game registration opened",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error starting weekly game:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
