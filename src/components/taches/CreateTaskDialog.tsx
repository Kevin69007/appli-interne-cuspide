import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecurrenceSelector } from "./RecurrenceSelector";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmployeeId: string | null;
  onTaskCreated: () => void;
  canAssignOthers: boolean;
}

export const CreateTaskDialog = ({
  open,
  onOpenChange,
  currentEmployeeId,
  onTaskCreated,
  canAssignOthers,
}: CreateTaskDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    assigned_to: currentEmployeeId || "",
    date_echeance: "",
    priorite: "normale" as "basse" | "normale" | "haute",
    recurrence: null as any,
    depend_de: null as string | null,
  });

  useEffect(() => {
    if (canAssignOthers) {
      fetchEmployees();
    }
  }, [canAssignOthers]);

  useEffect(() => {
    if (currentEmployeeId && !formData.assigned_to) {
      setFormData((prev) => ({ ...prev, assigned_to: currentEmployeeId }));
    }
  }, [currentEmployeeId]);

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
    if (!currentEmployeeId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("tasks").insert([
        {
          titre: formData.titre,
          description: formData.description,
          created_by: currentEmployeeId,
          assigned_to: formData.assigned_to,
          date_echeance: formData.date_echeance,
          priorite: formData.priorite,
          recurrence: formData.recurrence,
          depend_de: formData.depend_de,
          statut: "en_cours",
        },
      ]);

      if (error) throw error;

      toast.success("Tâche créée avec succès");
      setFormData({
        titre: "",
        description: "",
        assigned_to: currentEmployeeId,
        date_echeance: "",
        priorite: "normale",
        recurrence: null,
        depend_de: null,
      });
      onOpenChange(false);
      onTaskCreated();

      // Créer une notification
      if (formData.assigned_to !== currentEmployeeId) {
        await supabase.from("notifications").insert([
          {
            employee_id: formData.assigned_to,
            titre: "Nouvelle tâche assignée",
            message: `Vous avez été assigné à la tâche : ${formData.titre}`,
            type: "task_assigned",
            url: "/taches",
          },
        ]);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Erreur lors de la création de la tâche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Titre de la tâche"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée"
            />
          </div>

          {canAssignOthers && (
            <div>
              <Label htmlFor="assigned_to">Assigner à *</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
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
          )}

          <div>
            <Label htmlFor="date_echeance">Date d'échéance *</Label>
            <Input
              id="date_echeance"
              type="date"
              value={formData.date_echeance}
              onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="priorite">Priorité</Label>
            <Select
              value={formData.priorite}
              onValueChange={(v: any) => setFormData({ ...formData, priorite: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canAssignOthers && (
            <div>
              <Label htmlFor="depend_de">Dépendance (optionnel)</Label>
              <Select
                value={formData.depend_de || ""}
                onValueChange={(v) => setFormData({ ...formData, depend_de: v || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune dépendance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {employees
                    .filter((e) => e.id !== formData.assigned_to)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.prenom} {emp.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <RecurrenceSelector
            value={formData.recurrence}
            onChange={(recurrence) => setFormData({ ...formData, recurrence })}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.titre || !formData.date_echeance}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
