import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmployeeId: string | null;
  onProjectCreated: () => void;
}

export const CreateProjectDialog = ({
  open,
  onOpenChange,
  currentEmployeeId,
  onProjectCreated,
}: CreateProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    responsable_id: "",
    statut: "a_venir",
    is_priority: false,
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");
    if (data) setEmployees(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployeeId) {
      toast.error("Vous devez être associé à un employé");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("projects").insert({
        titre: formData.titre,
        description: formData.description,
        responsable_id: formData.responsable_id,
        statut: formData.statut as any,
        is_priority: formData.is_priority,
        created_by: currentEmployeeId,
      } as any);

      if (error) throw error;

      toast.success("Projet créé avec succès");
      onProjectCreated();
      onOpenChange(false);
      setFormData({
        titre: "",
        description: "",
        responsable_id: "",
        statut: "a_venir",
        is_priority: false,
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Erreur lors de la création du projet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-sm:p-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Créer un nouveau projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="titre" className="text-sm">Titre du projet *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="responsable" className="text-sm">Responsable *</Label>
              <Select
                value={formData.responsable_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, responsable_id: value })
                }
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un responsable" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.prenom} {emp.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="statut" className="text-sm">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_venir">À venir</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="en_pause">En pause</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="priority"
              checked={formData.is_priority}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_priority: checked as boolean })
              }
            />
            <Label htmlFor="priority" className="cursor-pointer text-sm">
              Marquer comme projet prioritaire
            </Label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Création..." : "Créer le projet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
