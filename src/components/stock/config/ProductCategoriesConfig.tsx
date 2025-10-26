import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImportCategoriesDialog } from "./ImportCategoriesDialog";

export const ProductCategoriesConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error("Le nom est obligatoire");

      if (editingId) {
        const { error } = await supabase
          .from("product_categories")
          .update({ name, description })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_categories")
          .insert({ name, description });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Catégorie modifiée" : "Catégorie créée" });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Catégorie supprimée" });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const startEdit = (category: any) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || "");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{editingId ? "Modifier" : "Nouvelle"} catégorie</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la catégorie"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
            )}
            <Button
              onClick={() => saveCategory.mutate()}
              disabled={saveCategory.isPending}
              className="flex-1"
            >
              {saveCategory.isPending ? "Enregistrement..." : editingId ? "Modifier" : "Créer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Catégories existantes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : categories && categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Supprimer cette catégorie ?")) {
                          deleteCategory.mutate(category.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune catégorie. Créez-en une pour commencer.
            </p>
          )}
        </CardContent>
      </Card>

      <ImportCategoriesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
};
