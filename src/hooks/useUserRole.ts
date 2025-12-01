import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "admin" | "manager" | "user" | null;

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user role:", error);
          return "user" as UserRole;
        }

        if (data && data.length > 0) {
          // Prioritize admin > manager > user
          const roles = data.map(r => r.role);
          if (roles.includes("admin")) {
            return "admin" as UserRole;
          } else if (roles.includes("manager")) {
            return "manager" as UserRole;
          } else {
            return "user" as UserRole;
          }
        }

        return "user" as UserRole;
      } catch (error) {
        console.error("Error:", error);
        return "user" as UserRole;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache 5 minutes
  });

  return { 
    role: role ?? null,
    loading: isLoading, 
    isAdmin: role === "admin", 
    isManager: role === "manager" 
  };
};
