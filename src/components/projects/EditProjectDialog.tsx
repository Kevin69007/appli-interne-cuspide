import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  currentEmployeeId: string | null;
  onProjectUpdated: () => void;
}

export const EditProjectDialog = ({
  open,
  onOpenChange,
  project,
  currentEmployeeId,
  onProjectUpdated,
}: EditProjectDialogProps) => {
  const isCreator = project.created_by === currentEmployeeId;
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    titre: project.titre || "",
    description: project.description || "",
    responsable_id: project.responsable_id || "",
    date_echeance: project.date_echeance || "",
    statut: project.statut || "a_venir",
    is_priority: project.is_priority || false,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (project) {
      setFormData({
        titre: project.titre || "",
        description: project.description || "",
        responsable_id: project.responsable_id || "",
        date_echeance: project.date_echeance || "",
        statut: project.statut || "a_venir",
        is_priority: project.is_priority || false,
      });
    }
  }, [project]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          titre: formData.titre,
          description: formData.description,
          responsable_id: formData.responsable_id,
          date_echeance: formData.date_echeance || null,
          statut: formData.statut,
          is_priority: formData.is_priority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Projet mis à jour avec succès");
      onOpenChange(false);
      onProjectUpdated();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Erreur lors de la mise à jour du projet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Titre du projet"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée du projet"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="responsable">Responsable du projet *</Label>
            <Select
              value={formData.responsable_id}
              onValueChange={(v) => setFormData({ ...formData, responsable_id: v })}
            >
              <SelectTrigger>
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
            <Label htmlFor="date_echeance">Date d'échéance</Label>
            {isCreator ? (
              <Input
                id="date_echeance"
                type="date"
                value={formData.date_echeance}
                onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
              />
            ) : (
              <div className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                <span className="text-sm">
                  {formData.date_echeance 
                    ? new Date(formData.date_echeance).toLocaleDateString("fr-FR")
                    : "Non définie"}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Ce projet a été créé par une autre personne.
                      Vous devez lui demander de changer la date.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <Select
              value={formData.statut}
              onValueChange={(v) => setFormData({ ...formData, statut: v })}
            >
              <SelectTrigger>
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_priority"
              checked={formData.is_priority}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_priority: checked as boolean })
              }
            />
            <Label htmlFor="is_priority" className="font-medium cursor-pointer">
              Projet prioritaire
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.titre || !formData.responsable_id}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};