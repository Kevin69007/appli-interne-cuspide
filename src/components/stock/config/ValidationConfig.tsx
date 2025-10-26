import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export const ValidationConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees-with-validation-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          validation_config:user_validation_config(validation_mode)
        `)
        .order("nom");

      if (error) throw error;
      return data;
    },
  });

  const updateValidationMode = useMutation({
    mutationFn: async ({ employeeId, mode }: { employeeId: string; mode: "auto" | "manual" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentEmployee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      // Check if config exists
      const { data: existingConfig } = await supabase
        .from("user_validation_config")
        .select("*")
        .eq("employee_id", employeeId)
        .single();

      if (existingConfig) {
        const { error } = await supabase
          .from("user_validation_config")
          .update({
            validation_mode: mode,
            updated_by: currentEmployee?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("employee_id", employeeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_validation_config")
          .insert([{
            employee_id: employeeId,
            validation_mode: mode,
            updated_by: currentEmployee?.id,
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Configuration mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["employees-with-validation-config"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de validation des commandes</CardTitle>
        <CardDescription>
          Définissez pour chaque utilisateur si ses commandes sont validées automatiquement ou nécessitent l'approbation d'un manager
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          <div className="space-y-3">
            {employees?.map((employee) => {
              const currentMode = employee.validation_config?.validation_mode || "manual";
              
              return (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {employee.prenom} {employee.nom}
                    </p>
                    {employee.poste && (
                      <p className="text-sm text-muted-foreground">{employee.poste}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {currentMode === "auto" ? (
                      <Badge className="bg-green-500">Validation auto</Badge>
                    ) : (
                      <Badge variant="outline">Validation manuelle</Badge>
                    )}
                    <Select
                      value={currentMode}
                      onValueChange={(mode) => updateValidationMode.mutate({ employeeId: employee.id, mode: mode as "auto" | "manual" })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Validation manuelle</SelectItem>
                        <SelectItem value="auto">Validation automatique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">À propos de la validation</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Validation automatique</strong> : Les commandes sont directement validées et prêtes à être passées</li>
            <li>• <strong>Validation manuelle</strong> : Les commandes nécessitent l'approbation d'un manager avant d'être passées</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
