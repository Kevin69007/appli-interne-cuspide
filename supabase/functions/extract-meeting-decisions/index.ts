import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get meeting with transcription
    const { data: meeting, error: meetingError} = await supabase
      .from('project_meetings')
      .select('transcription, titre, project:projects!project_meetings_project_id_fkey(titre)')
      .eq('id', meetingId)
      .single();

    if (meetingError) throw meetingError;

    if (!meeting.transcription) {
      throw new Error('No transcription available for this meeting');
    }

    const projectTitle = Array.isArray(meeting.project) && meeting.project.length > 0 
      ? meeting.project[0].titre 
      : null;

    console.log('Extracting decisions for meeting:', meeting.titre);

    // Call OpenAI GPT-4 to extract decisions
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant qui extrait les décisions et actions actionnables d'une réunion.
            Retourne un tableau JSON avec chaque décision au format :
            {
              "type": "decision|action|date_modifiee|tache_a_creer",
              "description": "Description claire et concise",
              "action_required": true/false
            }
            
            Types de décisions :
            - decision: Décision prise pendant la réunion
            - action: Action à entreprendre par quelqu'un
            - date_modifiee: Modification d'échéance ou de planning
            - tache_a_creer: Nouvelle tâche identifiée
            
            Retourne UNIQUEMENT le JSON, sans texte autour.`
          },
          {
            role: 'user',
            content: `Réunion: ${meeting.titre}
            ${projectTitle ? `Projet: ${projectTitle}` : ''}
            
            Transcription:
            ${meeting.transcription}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error('GPT API error:', gptResponse.status, errorText);
      throw new Error(`GPT API error: ${gptResponse.status}`);
    }

    const gptData = await gptResponse.json();
    let decisionsText = gptData.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    decisionsText = decisionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let decisions;
    try {
      decisions = JSON.parse(decisionsText);
      if (!Array.isArray(decisions)) {
        decisions = [decisions];
      }
    } catch (parseError) {
      console.error('Failed to parse decisions JSON:', decisionsText);
      decisions = [];
    }

    console.log('Extracted decisions:', decisions.length);

    // Update meeting with decisions
    const { error: updateError } = await supabase
      .from('project_meetings')
      .update({ decisions })
      .eq('id', meetingId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, decisions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-meeting-decisions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
