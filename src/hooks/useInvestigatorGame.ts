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

  // Get all participants (for voting list)
  const { data: participants, isLoading: participantsLoading } = useQuery({
    queryKey: ["game-participants", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("game_participants")
        .select("id, employee_id, role, is_eliminated, employees!game_participants_employee_id_fkey(id, prenom, nom)")
        .eq("session_id", sessionId)
        .eq("is_eliminated", false);

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
  });

  // Submit vote
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

  return {
    clues,
    myVote,
    participants,
    isLoading: cluesLoading || voteLoading || participantsLoading,
    vote: voteMutation.mutate,
    isVoting: voteMutation.isPending,
  };
};
