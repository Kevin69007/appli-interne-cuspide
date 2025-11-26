import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔧 Setting up weekly game cron jobs...");

    const cronJobs = [
      {
        name: "start-weekly-game-monday-8am",
        schedule: "0 8 * * 1", // Monday 8 AM
        function: "start-weekly-game",
        description: "Open weekly game registration",
      },
      {
        name: "draw-target-monday-noon",
        schedule: "0 12 * * 1", // Monday 12 PM
        function: "draw-target",
        description: "Draw random target and assign investigators",
      },
      {
        name: "reveal-anecdote-monday-2pm",
        schedule: "0 14 * * 1", // Monday 2 PM
        function: "reveal-anecdote",
        description: "Reveal anecdote and start the game",
      },
      {
        name: "daily-clue-reveal-tuesday",
        schedule: "0 8 * * 2", // Tuesday 8 AM
        function: "daily-clue-reveal",
        description: "Reveal Tuesday's clue",
      },
      {
        name: "daily-clue-reveal-wednesday",
        schedule: "0 8 * * 3", // Wednesday 8 AM
        function: "daily-clue-reveal",
        description: "Reveal Wednesday's clue",
      },
      {
        name: "daily-clue-reveal-thursday",
        schedule: "0 8 * * 4", // Thursday 8 AM
        function: "daily-clue-reveal",
        description: "Reveal Thursday's clue",
      },
      {
        name: "process-eliminations-tuesday",
        schedule: "0 0 * * 2", // Tuesday midnight
        function: "process-daily-eliminations",
        description: "Process Tuesday's elimination votes",
      },
      {
        name: "process-eliminations-wednesday",
        schedule: "0 0 * * 3", // Wednesday midnight
        function: "process-daily-eliminations",
        description: "Process Wednesday's elimination votes",
      },
      {
        name: "process-eliminations-thursday",
        schedule: "0 0 * * 4", // Thursday midnight
        function: "process-daily-eliminations",
        description: "Process Thursday's elimination votes",
      },
      {
        name: "final-vote-reveal-friday",
        schedule: "0 8 * * 5", // Friday 8 AM
        function: "final-vote-reveal",
        description: "Reveal final results and distribute rewards",
      },
    ];

    // First, unschedule any existing jobs to avoid duplicates
    for (const job of cronJobs) {
      try {
        await supabase.rpc("cron.unschedule", { job_name: job.name });
        console.log(`🗑️  Unscheduled existing job: ${job.name}`);
      } catch (error) {
        // Job might not exist, ignore error
        console.log(`ℹ️  No existing job to unschedule: ${job.name}`);
      }
    }

    // Schedule all cron jobs
    const results = [];
    for (const job of cronJobs) {
      const sql = `
        SELECT cron.schedule(
          '${job.name}',
          '${job.schedule}',
          $$
          SELECT
            net.http_post(
                url:='${supabaseUrl}/functions/v1/${job.function}',
                headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseAnonKey}"}'::jsonb,
                body:=concat('{"time": "', now(), '"}')::jsonb
            ) as request_id;
          $$
        );
      `;

      try {
        const { data, error } = await supabase.rpc("exec_sql", { sql });
        
        if (error) {
          // Try alternative method: direct query execution
          const { error: directError } = await supabase
            .from("cron.job")
            .insert({
              jobname: job.name,
              schedule: job.schedule,
              command: `SELECT net.http_post(url:='${supabaseUrl}/functions/v1/${job.function}', headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseAnonKey}"}'::jsonb, body:=concat('{"time": "', now(), '"}')::jsonb) as request_id;`,
            });

          if (directError) {
            console.error(`❌ Error scheduling ${job.name}:`, directError);
            results.push({ job: job.name, success: false, error: directError.message });
          } else {
            console.log(`✅ Scheduled: ${job.name} - ${job.description}`);
            results.push({ job: job.name, success: true });
          }
        } else {
          console.log(`✅ Scheduled: ${job.name} - ${job.description}`);
          results.push({ job: job.name, success: true });
        }
      } catch (error) {
        console.error(`❌ Error scheduling ${job.name}:`, error);
        results.push({ 
          job: job.name, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    console.log("✅ Cron setup complete!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Weekly game cron jobs configured",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error setting up cron jobs:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
