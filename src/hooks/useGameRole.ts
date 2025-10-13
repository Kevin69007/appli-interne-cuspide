import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGameRole = (sessionId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["game-role", sessionId, user?.id],
    queryFn: async () => {
      if (!sessionId || !user) return null;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return null;

      const { data, error } = await supabase
        .from("game_participants")
        .select("role, is_eliminated")
        .eq("session_id", sessionId)
        .eq("employee_id", employee.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!user,
  });
};
