import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateSupplierDialog } from "./CreateSupplierDialog";
import { useUserRole } from "@/hooks/useUserRole";

export const SuppliersList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select(`
          *,
          responsible:employees!suppliers_responsible_employee_id_fkey(nom, prenom)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suppliers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Fournisseur supprimé" });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gérez vos fournisseurs et leurs responsables
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau fournisseur
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers?.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setShowCreateDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Supprimer ce fournisseur ?")) {
                            deleteSupplier.mutate(supplier.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {supplier.contact_email && (
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <a href={`mailto:${supplier.contact_email}`} className="text-primary hover:underline">
                      {supplier.contact_email}
                    </a>
                  </p>
                )}
                {supplier.contact_phone && (
                  <p>
                    <span className="text-muted-foreground">Tél:</span>{" "}
                    {supplier.contact_phone}
                  </p>
                )}
                {supplier.responsible && (
                  <p>
                    <span className="text-muted-foreground">Responsable:</span>{" "}
                    <span className="font-medium">
                      {supplier.responsible.prenom} {supplier.responsible.nom}
                    </span>
                  </p>
                )}
                {supplier.notes && (
                  <p className="text-muted-foreground text-xs mt-2">
                    {supplier.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSupplierDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditingSupplier(null);
        }}
        supplier={editingSupplier}
      />
    </div>
  );
};
