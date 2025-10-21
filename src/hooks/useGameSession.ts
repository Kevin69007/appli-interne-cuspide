import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGameSession = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current active session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["game-session"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_game_sessions")
        .select("*")
        .in("status", ["registration_open", "waiting_anecdote", "in_progress", "finished", "cancelled_no_anecdote"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Get current user's participation
  const { data: participation, isLoading: participationLoading } = useQuery({
    queryKey: ["game-participation", session?.id, user?.id],
    queryFn: async () => {
      if (!session || !user) return null;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return null;

      const { data, error } = await supabase
        .from("game_participants")
        .select("*")
        .eq("session_id", session.id)
        .eq("employee_id", employee.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!session && !!user,
  });

  // Register for the game
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!session || !user) throw new Error("No session or user");

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) throw new Error("Employee not found");

      const { error } = await supabase.from("game_participants").insert({
        session_id: session.id,
        employee_id: employee.id,
        role: "investigator", // Will be updated during draw
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-participation"] });
    },
  });

  // Submit anecdote and clues (for target only)
  const submitAnecdoteMutation = useMutation({
    mutationFn: async ({
      anecdote,
      clues,
    }: {
      anecdote: string;
      clues: string[];
    }) => {
      if (!session) throw new Error("No active session");

      // Update session with anecdote
      const { error: sessionError } = await supabase
        .from("weekly_game_sessions")
        .update({ anecdote })
        .eq("id", session.id);

      if (sessionError) throw sessionError;

      // Delete existing clues for this session (in case of resubmission)
      await supabase
        .from("game_clues")
        .delete()
        .eq("session_id", session.id);

      // Insert new clues
      const clueData = clues.map((clue, index) => ({
        session_id: session.id,
        clue_number: index + 1,
        clue_text: clue,
      }));

      const { error: cluesError } = await supabase
        .from("game_clues")
        .insert(clueData);

      if (cluesError) throw cluesError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-session"] });
    },
  });

  return {
    session,
    participation,
    isLoading: sessionLoading || participationLoading,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    submitAnecdote: submitAnecdoteMutation.mutate,
    isSubmitting: submitAnecdoteMutation.isPending,
  };
};
