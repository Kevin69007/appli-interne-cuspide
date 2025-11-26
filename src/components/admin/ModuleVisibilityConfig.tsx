import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Module {
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

export const ModuleVisibilityConfig = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("module_visibility")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Erreur lors du chargement des modules");
    } finally {
      setLoading(false);
    }
  };

  const updateModule = async (
    moduleId: string,
    updates: Partial<Module>
  ) => {
    setSaving(moduleId);
    try {
      const { error } = await supabase
        .from("module_visibility")
        .update(updates)
        .eq("id", moduleId);

      if (error) throw error;

      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, ...updates } : m))
      );
      toast.success("Module mis à jour");
    } catch (error) {
      console.error("Error updating module:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration des Modules</CardTitle>
        <CardDescription>
          Gérez la visibilité des modules selon les rôles des utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4 pb-2 border-b font-semibold text-sm">
            <div className="col-span-2">Module</div>
            <div className="text-center">Actif</div>
            <div className="text-center">Admin</div>
            <div className="text-center">Manager</div>
            <div className="text-center">Employé</div>
          </div>

          {modules.map((module) => (
            <div
              key={module.id}
              className="grid grid-cols-6 gap-4 items-center py-3 border-b last:border-b-0"
            >
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-2xl">{module.icon}</span>
                <div>
                  <div className="font-medium">{module.module_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {module.path}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Switch
                  checked={module.is_enabled}
                  onCheckedChange={(checked) =>
                    updateModule(module.id, { is_enabled: checked })
                  }
                  disabled={saving === module.id}
                />
              </div>

              <div className="flex justify-center">
                <Switch
                  checked={module.visible_to_admin}
                  onCheckedChange={(checked) =>
                    updateModule(module.id, { visible_to_admin: checked })
                  }
                  disabled={saving === module.id || !module.is_enabled}
                />
              </div>

              <div className="flex justify-center">
                <Switch
                  checked={module.visible_to_manager}
                  onCheckedChange={(checked) =>
                    updateModule(module.id, { visible_to_manager: checked })
                  }
                  disabled={saving === module.id || !module.is_enabled}
                />
              </div>

              <div className="flex justify-center">
                <Switch
                  checked={module.visible_to_user}
                  onCheckedChange={(checked) =>
                    updateModule(module.id, { visible_to_user: checked })
                  }
                  disabled={saving === module.id || !module.is_enabled}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
