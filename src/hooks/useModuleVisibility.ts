import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export interface ModuleConfig {
  id: string;
  module_key: string;
  module_name: string;
  icon: string;
  path: string;
  is_external: boolean;
  visible_to_admin: boolean;
  visible_to_manager: boolean;
  visible_to_user: boolean;
  is_enabled: boolean;
  display_order: number;
}

export const useModuleVisibility = () => {
  const { isAdmin, isManager, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules', isAdmin, isManager],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_visibility")
        .select("*")
        .eq("is_enabled", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Filter modules based on user role
      const filteredModules = data?.filter((module) => {
        if (isAdmin) return module.visible_to_admin;
        if (isManager) return module.visible_to_manager;
        return module.visible_to_user;
      }) || [];

      return filteredModules;
    },
    enabled: !roleLoading,
    staleTime: 1000 * 60 * 5, // Cache 5 minutes
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("module_visibility_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "module_visibility",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['modules'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { modules, loading: roleLoading || isLoading };
};
