import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface SubTasksListProps {
  parentTaskId: string;
  currentEmployeeId: string | null;
  onUpdate: () => void;
}

export const SubTasksList = ({ parentTaskId, currentEmployeeId, onUpdate }: SubTasksListProps) => {
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  useEffect(() => {
    fetchSubTasks();
  }, [parentTaskId]);

  const fetchSubTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("parent_task_id", parentTaskId)
      .order("created_at");

    if (!error && data) {
      setSubTasks(data);
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim() || !currentEmployeeId) return;

    setLoading(true);
    try {
      // Get parent task data
      const { data: parentTask } = await supabase
        .from("tasks")
        .select("assigned_to, date_echeance")
        .eq("id", parentTaskId)
        .single();

      if (!parentTask) throw new Error("Parent task not found");

      const { error } = await supabase.from("tasks").insert([
        {
          titre: newSubTaskTitle,
          created_by: currentEmployeeId,
          assigned_to: parentTask.assigned_to,
          date_echeance: parentTask.date_echeance,
          parent_task_id: parentTaskId,
          statut: "en_cours",
        },
      ]);

      if (error) throw error;

      toast.success("Sous-tâche ajoutée");
      setNewSubTaskTitle("");
      fetchSubTasks();
      onUpdate();
    } catch (error) {
      console.error("Error adding subtask:", error);
      toast.error("Erreur lors de l'ajout de la sous-tâche");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubTask = async (subTaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "terminee" ? "en_cours" : "terminee";

    const { error } = await supabase
      .from("tasks")
      .update({ statut: newStatus })
      .eq("id", subTaskId);

    if (!error) {
      fetchSubTasks();
      onUpdate();
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
    if (!confirm("Supprimer cette sous-tâche ?")) return;

    const { error } = await supabase
      .from("tasks")
      .update({ statut: "annulee" })
      .eq("id", subTaskId);

    if (!error) {
      toast.success("Sous-tâche supprimée");
      fetchSubTasks();
      onUpdate();
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        {subTasks.length > 0 ? (
          subTasks
            .filter((st) => st.statut !== "annulee")
            .map((subTask) => (
              <div key={subTask.id} className="flex items-center gap-2 border rounded-lg p-3">
                <Checkbox
                  checked={subTask.statut === "terminee"}
                  onCheckedChange={() => handleToggleSubTask(subTask.id, subTask.statut)}
                />
                <span
                  className={`flex-1 ${
                    subTask.statut === "terminee" ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {subTask.titre}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSubTask(subTask.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune sous-tâche</p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newSubTaskTitle}
          onChange={(e) => setNewSubTaskTitle(e.target.value)}
          placeholder="Nouvelle sous-tâche..."
          onKeyDown={(e) => e.key === "Enter" && handleAddSubTask()}
        />
        <Button onClick={handleAddSubTask} disabled={loading || !newSubTaskTitle.trim()} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
