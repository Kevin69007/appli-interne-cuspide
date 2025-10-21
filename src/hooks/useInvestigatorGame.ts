import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useInvestigatorGame = (sessionId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get revealed clues
  const { data: clues, isLoading: cluesLoading } = useQuery({
    queryKey: ["game-clues", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("game_clues")
        .select("*")
        .eq("session_id", sessionId)
        .eq("is_revealed", true)
        .order("clue_number");

      if (error) {
        console.error("Error fetching clues:", error);
        throw error;
      }
      
      console.log("📋 Fetched revealed clues:", data);
      return data || [];
    },
    enabled: !!sessionId,
    refetchInterval: 5000, // Refresh every 5 seconds to get new revealed clues
  });

  // Get current user's employee ID
  const { data: employeeId } = useQuery({
    queryKey: ["employee-id", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data?.id;
    },
    enabled: !!user,
  });

  // Get current user's vote
  const { data: myVote, isLoading: voteLoading } = useQuery({
    queryKey: ["my-vote", sessionId, employeeId],
    queryFn: async () => {
      if (!sessionId || !employeeId) return null;

      const { data, error } = await supabase
        .from("game_votes")
        .select("*, suspect_employee:employees!game_votes_suspect_employee_id_fkey(id, prenom, nom)")
        .eq("session_id", sessionId)
        .eq("voter_employee_id", employeeId)
        .eq("vote_type", "elimination")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!employeeId,
  });

  // Get all employees (for voting list)
  const { data: allEmployees, isLoading: employeesLoading } = useQuery({
    queryKey: ["all-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, prenom, nom, photo_url, poste, equipe")
        .order("nom");

      if (error) throw error;
      return data || [];
    },
  });

  // Submit elimination vote
  const voteMutation = useMutation({
    mutationFn: async (suspectEmployeeId: string) => {
      if (!sessionId || !employeeId) throw new Error("Missing data");

      const { error } = await supabase.from("game_votes").insert({
        session_id: sessionId,
        voter_employee_id: employeeId,
        suspect_employee_id: suspectEmployeeId,
        vote_type: "elimination",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-vote"] });
    },
  });

  // Submit anecdote vote
  const voteAnecdoteMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!sessionId || !employeeId) throw new Error("Missing data");

      const { error } = await supabase.from("game_votes").insert({
        session_id: sessionId,
        voter_employee_id: employeeId,
        vote_type: "anecdote_originality",
        originality_rating: rating,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-vote"] });
    },
  });

  // Submit clue vote
  const voteClueMutation = useMutation({
    mutationFn: async ({ clueId, difficultyRating, originalityRating }: { clueId: string; difficultyRating: number; originalityRating: number }) => {
      if (!sessionId || !employeeId) throw new Error("Missing data");

      const { error } = await supabase.from("game_votes").insert({
        session_id: sessionId,
        voter_employee_id: employeeId,
        vote_type: "clue_difficulty",
        clue_id: clueId,
        difficulty_rating: difficultyRating,
        originality_rating: originalityRating,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-vote"] });
    },
  });

  return {
    clues,
    myVote,
    allEmployees,
    isLoading: cluesLoading || voteLoading || employeesLoading,
    vote: voteMutation.mutate,
    isVoting: voteMutation.isPending,
    voteAnecdote: voteAnecdoteMutation.mutate,
    isVotingAnecdote: voteAnecdoteMutation.isPending,
    voteClue: voteClueMutation.mutate,
    isVotingClue: voteClueMutation.isPending,
  };
};
