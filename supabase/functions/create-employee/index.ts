import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { nom, prenom, poste, email, password, role, is_remote } = await req.json();

    // Vérifier si l'email existe déjà dans employees
    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmployee) {
      return new Response(
        JSON.stringify({ error: 'Un employé avec cet email existe déjà.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer l'utilisateur dans auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${prenom} ${nom}`
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Aucun utilisateur créé' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer l'entrée employee
    const { error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        nom,
        prenom,
        poste,
        email,
        user_id: authData.user.id,
        is_remote: is_remote || false
      });

    if (employeeError) {
      console.error('Employee error:', employeeError);
      // Supprimer l'utilisateur auth si l'insertion employee échoue
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: employeeError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mettre à jour le rôle si nécessaire
    if (role && (role === 'admin' || role === 'manager')) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', authData.user.id);

      if (roleError) {
        console.error('Role error:', roleError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${prenom} ${nom} a été ajouté avec succès.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
