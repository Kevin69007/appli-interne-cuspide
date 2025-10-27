import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LinkTaskToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onTaskLinked: () => void;
}

export const LinkTaskToProjectDialog = ({
  open,
  onOpenChange,
  projectId,
  onTaskLinked,
}: LinkTaskToProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  useEffect(() => {
    if (open) {
      fetchAvailableTasks();
    }
  }, [open, projectId]);

  const fetchAvailableTasks = async () => {
    try {
      // Get tasks already linked to this project
      const { data: linkedTasks } = await supabase
        .from("project_tasks")
        .select("task_id")
        .eq("project_id", projectId);

      const linkedTaskIds = linkedTasks?.map((pt) => pt.task_id) || [];

      // Get all tasks not linked to this project
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          titre,
          date_echeance,
          statut,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom)
        `)
        .not("id", "in", `(${linkedTaskIds.join(",")})`)
        .neq("statut", "annulee")
        .order("date_echeance");

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Erreur lors du chargement des tâches");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) {
      toast.error("Veuillez sélectionner une tâche");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("project_tasks").insert({
        project_id: projectId,
        task_id: selectedTaskId,
      });

      if (error) throw error;

      toast.success("Tâche liée au projet avec succès");
      onTaskLinked();
      onOpenChange(false);
      setSelectedTaskId("");
    } catch (error) {
      console.error("Error linking task:", error);
      toast.error("Erreur lors de la liaison de la tâche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lier une tâche existante au projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task">Sélectionner une tâche</Label>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une tâche..." />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.titre} - {task.assigned_employee?.prenom}{" "}
                    {task.assigned_employee?.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Aucune tâche disponible à lier
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || tasks.length === 0}>
              {loading ? "Liaison..." : "Lier la tâche"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
