import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { RecurrenceSelectorNew } from "./RecurrenceSelectorNew";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { Checkbox } from "@/components/ui/checkbox";

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
  isMaintenance?: boolean;
  projectId?: string;
}

export const CreateTaskDialog = ({
  open,
  onOpenChange,
  currentEmployeeId,
  onTaskCreated,
  canAssignOthers,
  isMaintenance = false,
  projectId,
}: CreateTaskDialogProps) => {
  const { t } = useTranslation('tasks');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    assigned_to: currentEmployeeId || "",
    date_echeance: "",
    priorite: "normale" as "basse" | "normale" | "haute",
    recurrence: null as any,
    machine_piece: "",
    maintenance_type: "" as "machine" | "piece" | "",
    is_priority: false,
    validation_mode: "creator" as "creator" | "none" | "other",
    validation_responsable_id: "",
  });
  // Pour la sélection multiple en maintenance
  const [multipleAssignees, setMultipleAssignees] = useState<string[]>([]);

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

  // Lier automatiquement "tâche prioritaire" → "priorité haute"
  useEffect(() => {
    if (formData.is_priority) {
      setFormData((prev) => ({ ...prev, priorite: "haute" }));
    }
  }, [formData.is_priority]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id, 
        nom, 
        prenom,
        user_id
      `)
      .order("nom");

    if (!error && data) {
      // Tous les employés, y compris les admins
      setEmployees(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployeeId) {
      console.error("No currentEmployeeId available");
      toast.error(t('create.errors.noEmployee'));
      return;
    }

    // Sélection multiple pour toutes les tâches
    const assignees = multipleAssignees.length > 0 
      ? multipleAssignees 
      : (formData.assigned_to ? [formData.assigned_to] : []);

    if (assignees.length === 0) {
      toast.error("Veuillez sélectionner au moins un employé");
      return;
    }

    setLoading(true);
    try {
      // Déterminer le responsable de validation
      let validationResponsableId: string | null = null;
      if (formData.validation_mode === "creator") {
        validationResponsableId = currentEmployeeId;
      } else if (formData.validation_mode === "other" && formData.validation_responsable_id) {
        validationResponsableId = formData.validation_responsable_id;
      }
      // Si "none", validationResponsableId reste null

      // Créer une tâche pour chaque assigné
      const tasksToCreate = assignees.map(assigneeId => {
        const taskData: any = {
          titre: formData.titre,
          description: formData.description,
          created_by: currentEmployeeId,
          assigned_to: assigneeId,
          date_echeance: formData.date_echeance,
          priorite: formData.priorite,
          recurrence: formData.recurrence,
          statut: "en_cours",
          is_priority: formData.is_priority,
          validation_responsable_id: validationResponsableId,
        };

        if (isMaintenance && formData.machine_piece && formData.maintenance_type) {
          taskData.machine_piece = formData.machine_piece;
          taskData.maintenance_type = formData.maintenance_type;
        }

        return taskData;
      });

      const { data, error } = await supabase.from("tasks").insert(tasksToCreate).select();

      if (error) throw error;

      // Si un projectId est fourni, lier les tâches au projet
      if (projectId && data) {
        const projectTaskLinks = data.map(task => ({
          project_id: projectId,
          task_id: task.id,
        }));
        const { error: linkError } = await supabase.from("project_tasks").insert(projectTaskLinks);
        if (linkError) console.error("Error linking tasks to project:", linkError);
      }

      // Créer des notifications pour chaque assigné différent du créateur
      const notificationsToCreate = assignees
        .filter(assigneeId => assigneeId !== currentEmployeeId)
        .map(assigneeId => ({
          employee_id: assigneeId,
          titre: "Nouvelle tâche assignée",
          message: `Vous avez été assigné à la tâche : ${formData.titre}`,
          type: "task_assigned",
          url: isMaintenance ? "/entretiens-machines" : "/taches",
        }));

      if (notificationsToCreate.length > 0) {
        await supabase.from("notifications").insert(notificationsToCreate);
      }

      const successMessage = assignees.length > 1 
        ? `${assignees.length} tâches créées avec succès`
        : "Tâche créée avec succès";
      toast.success(successMessage);

      // Reset form
      setFormData({
        titre: "",
        description: "",
        assigned_to: currentEmployeeId,
        date_echeance: "",
        priorite: "normale",
        recurrence: null,
        machine_piece: "",
        maintenance_type: "",
        is_priority: false,
        validation_mode: "creator",
        validation_responsable_id: "",
      });
      setMultipleAssignees([]);
      onOpenChange(false);
      onTaskCreated();
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
          <DialogDescription className="sr-only">
            Formulaire de création d'une nouvelle tâche avec titre, description, assignation, échéance et options
          </DialogDescription>
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
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée"
              rows={3}
            />
          </div>

          {isMaintenance && (
            <>
              <div>
                <Label htmlFor="maintenance_type">Type d'entretien *</Label>
                <Select
                  value={formData.maintenance_type}
                  onValueChange={(v: any) => setFormData({ ...formData, maintenance_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="machine">Machine</SelectItem>
                    <SelectItem value="piece">Pièce/Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="machine_piece">
                  {formData.maintenance_type === "machine" ? "Nom de la machine" : "Nom de la pièce/local"} *
                </Label>
                <Input
                  id="machine_piece"
                  value={formData.machine_piece}
                  onChange={(e) => setFormData({ ...formData, machine_piece: e.target.value })}
                  placeholder={formData.maintenance_type === "machine" ? "Ex: Four de cuisson" : "Ex: Salle de finition"}
                  required={isMaintenance}
                />
              </div>
            </>
          )}

          {canAssignOthers && (
            <div>
              <Label htmlFor="assigned_to">
                Assigner à *
                <span className="text-xs text-muted-foreground ml-2">
                  (sélection multiple possible)
                </span>
              </Label>
              <MultiSelectCombobox
                selectedValues={multipleAssignees.length > 0 ? multipleAssignees : (formData.assigned_to ? [formData.assigned_to] : [])}
                onSelectedValuesChange={(values) => {
                  setMultipleAssignees(values);
                  if (values.length === 1) {
                    setFormData(prev => ({ ...prev, assigned_to: values[0] }));
                  } else if (values.length === 0) {
                    setFormData(prev => ({ ...prev, assigned_to: "" }));
                  }
                }}
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.prenom} ${emp.nom}`,
                }))}
                placeholder="Sélectionner les employés"
                searchPlaceholder="Rechercher un employé..."
              />
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
            <Label htmlFor="priorite">
              Priorité
              {formData.is_priority && (
                <span className="text-xs text-orange-500 ml-2">
                  (Automatiquement "Haute" pour les tâches prioritaires)
                </span>
              )}
            </Label>
            <Select
              value={formData.priorite}
              onValueChange={(v: any) => setFormData({ ...formData, priorite: v })}
              disabled={formData.is_priority}
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_priority"
              checked={formData.is_priority}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_priority: checked as boolean })
              }
            />
            <Label htmlFor="is_priority" className="font-medium cursor-pointer">
              Tâche prioritaire
              <p className="text-xs text-muted-foreground font-normal">
                Un suivi quotidien sera demandé
              </p>
            </Label>
          </div>

          <RecurrenceSelectorNew
            value={formData.recurrence}
            onChange={(recurrence) => setFormData({ ...formData, recurrence })}
          />

          {/* Validation de la clôture */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <Label className="font-medium">Validation de la clôture</Label>
            <Select
              value={formData.validation_mode}
              onValueChange={(v: "creator" | "none" | "other") => setFormData({ ...formData, validation_mode: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator">Par moi-même (créateur)</SelectItem>
                <SelectItem value="none">Pas de validation requise</SelectItem>
                <SelectItem value="other">Par une autre personne</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.validation_mode === "creator" && "Vous devrez valider quand l'assigné marquera la tâche comme terminée."}
              {formData.validation_mode === "none" && "L'assigné pourra clôturer la tâche directement sans validation."}
              {formData.validation_mode === "other" && "La personne sélectionnée devra valider la clôture."}
            </p>
            
            {formData.validation_mode === "other" && (
              <div>
                <Label className="text-sm">Responsable de la validation</Label>
                <Combobox
                  value={formData.validation_responsable_id}
                  onValueChange={(v) => setFormData({ ...formData, validation_responsable_id: v })}
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.prenom} ${emp.nom}`,
                  }))}
                  placeholder="Sélectionner un responsable..."
                  searchPlaceholder="Rechercher..."
                />
              </div>
            )}
          </div>

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
