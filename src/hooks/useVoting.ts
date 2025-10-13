import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useVoting = (sessionId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current employee ID
  const { data: employeeId } = useQuery({
    queryKey: ["employee-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data?.id;
    },
    enabled: !!user,
  });

  // Submit elimination votes
  const voteEliminationMutation = useMutation({
    mutationFn: async ({
      suspectIds,
      voteDay,
    }: {
      suspectIds: string[];
      voteDay: number;
    }) => {
      if (!sessionId || !employeeId) throw new Error("Missing session or employee");

      const votes = suspectIds.map((suspectId) => ({
        session_id: sessionId,
        voter_employee_id: employeeId,
        vote_type: "elimination" as const,
        vote_day: voteDay,
        suspect_employee_id: suspectId,
      }));

      const { error } = await supabase.from("game_votes").insert(votes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-votes"] });
    },
  });

  // Submit anecdote originality rating
  const voteOriginalityMutation = useMutation({
    mutationFn: async ({ rating }: { rating: number }) => {
      if (!sessionId || !employeeId) throw new Error("Missing session or employee");

      const { error } = await supabase.from("game_votes").insert({
        session_id: sessionId,
        voter_employee_id: employeeId,
        vote_type: "anecdote_originality",
        originality_rating: rating,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-votes"] });
    },
  });

  // Submit clue difficulty rating
  const voteDifficultyMutation = useMutation({
    mutationFn: async ({ clueId, rating }: { clueId: string; rating: number }) => {
      if (!sessionId || !employeeId) throw new Error("Missing session or employee");

      const { error } = await supabase.from("game_votes").insert({
        session_id: sessionId,
        voter_employee_id: employeeId,
        vote_type: "clue_difficulty",
        clue_id: clueId,
        difficulty_rating: rating,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-votes"] });
    },
  });

  // Submit final suspect vote
  const voteFinalSuspectMutation = useMutation({
    mutationFn: async ({ suspectId }: { suspectId: string }) => {
      if (!sessionId || !employeeId) throw new Error("Missing session or employee");

      const { error } = await supabase.from("game_votes").insert({
        session_id: sessionId,
        voter_employee_id: employeeId,
        vote_type: "final_suspect",
        suspect_employee_id: suspectId,
        vote_day: 5, // Friday
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-votes"] });
    },
  });

  return {
    voteElimination: voteEliminationMutation.mutate,
    voteOriginality: voteOriginalityMutation.mutate,
    voteDifficulty: voteDifficultyMutation.mutate,
    voteFinalSuspect: voteFinalSuspectMutation.mutate,
    isVoting:
      voteEliminationMutation.isPending ||
      voteOriginalityMutation.isPending ||
      voteDifficultyMutation.isPending ||
      voteFinalSuspectMutation.isPending,
  };
};
