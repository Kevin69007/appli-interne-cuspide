import { useEffect, useState } from "react";
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
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isManager } = useUserRole();

  useEffect(() => {
    const fetchModules = async () => {
      try {
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

        setModules(filteredModules);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();

    // Subscribe to changes
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
          fetchModules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, isManager]);

  return { modules, loading };
};
