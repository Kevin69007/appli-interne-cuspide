import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, MessageSquare, Calendar, Bell } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SubTasksListProps {
  parentTaskId: string;
  currentEmployeeId: string | null;
  onUpdate: () => void;
}

export const SubTasksList = ({ parentTaskId, currentEmployeeId, onUpdate }: SubTasksListProps) => {
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [activeActions, setActiveActions] = useState<{[key: string]: string}>({});
  const [actionInputs, setActionInputs] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchSubTasks();
  }, [parentTaskId]);

  const fetchSubTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        creator_employee:employees!tasks_created_by_fkey(nom, prenom)
      `)
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

  const handleAddComment = async (subTaskId: string) => {
    const comment = actionInputs[subTaskId];
    if (!comment?.trim() || !currentEmployeeId) return;
    
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("commentaires")
      .eq("id", subTaskId)
      .single();
    
      if (!currentTask) return;
    
    const { data: employee } = await supabase
      .from("employees")
      .select("nom, prenom")
      .eq("id", currentEmployeeId)
      .single();
    
    const employeeName = employee ? `${employee.prenom} ${employee.nom}` : "Employé";

      const existingComments = Array.isArray(currentTask.commentaires) ? currentTask.commentaires : [];
      const updatedComments = [
        ...existingComments,
        {
          auteur_id: currentEmployeeId,
          auteur_nom: employeeName,
          texte: comment,
          date: new Date().toISOString(),
        },
      ];
    
    const { error } = await supabase
      .from("tasks")
      .update({ 
        commentaires: updatedComments,
        last_progress_comment_at: new Date().toISOString()
      })
      .eq("id", subTaskId);
    
    if (!error) {
      toast.success("Commentaire ajouté");
      const newActiveActions = { ...activeActions };
      newActiveActions[subTaskId] = "";
      setActiveActions(newActiveActions);
      const newActionInputs = { ...actionInputs };
      newActionInputs[subTaskId] = "";
      setActionInputs(newActionInputs);
      fetchSubTasks();
      onUpdate();
    }
  };

  const handleUpdateDeadline = async (subTaskId: string) => {
    const newDate = actionInputs[subTaskId];
    if (!newDate) return;
    
    const { error } = await supabase
      .from("tasks")
      .update({ date_echeance: newDate })
      .eq("id", subTaskId);
    
    if (!error) {
      toast.success("Date mise à jour");
      const newActiveActions = { ...activeActions };
      newActiveActions[subTaskId] = "";
      setActiveActions(newActiveActions);
      const newActionInputs = { ...actionInputs };
      newActionInputs[subTaskId] = "";
      setActionInputs(newActionInputs);
      fetchSubTasks();
      onUpdate();
    }
  };

  const handleAddReminder = async (subTaskId: string) => {
    const reminderDate = actionInputs[subTaskId];
    if (!reminderDate) return;
    
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("rappels")
      .eq("id", subTaskId)
      .single();
    
    if (!currentTask) return;
    
    const existingRappels = Array.isArray(currentTask.rappels) ? currentTask.rappels : [];
    const updatedRappels = [
      ...existingRappels,
      {
        date: reminderDate,
        envoye: false,
      },
    ];
    
    const { error } = await supabase
      .from("tasks")
      .update({ rappels: updatedRappels })
      .eq("id", subTaskId);
    
    if (!error) {
      toast.success("Rappel ajouté");
      const newActiveActions = { ...activeActions };
      newActiveActions[subTaskId] = "";
      setActiveActions(newActiveActions);
      const newActionInputs = { ...actionInputs };
      newActionInputs[subTaskId] = "";
      setActionInputs(newActionInputs);
      fetchSubTasks();
      onUpdate();
    }
  };

  const renderActionInput = (subTaskId: string, action: string) => {
    if (activeActions[subTaskId] !== action) return null;

    switch (action) {
      case "comment":
        return (
          <div className="flex gap-2 mt-2 ml-8">
            <Textarea
              placeholder="Votre commentaire..."
              value={actionInputs[subTaskId] || ""}
              onChange={(e) => {
                const newInputs = { ...actionInputs };
                newInputs[subTaskId] = e.target.value;
                setActionInputs(newInputs);
              }}
              className="min-h-[60px]"
            />
            <Button size="sm" onClick={() => handleAddComment(subTaskId)}>
              Envoyer
            </Button>
          </div>
        );
      case "date":
        return (
          <div className="flex gap-2 mt-2 ml-8">
            <Input
              type="date"
              value={actionInputs[subTaskId] || ""}
              onChange={(e) => {
                const newInputs = { ...actionInputs };
                newInputs[subTaskId] = e.target.value;
                setActionInputs(newInputs);
              }}
            />
            <Button size="sm" onClick={() => handleUpdateDeadline(subTaskId)}>
              OK
            </Button>
          </div>
        );
      case "reminder":
        return (
          <div className="flex gap-2 mt-2 ml-8">
            <Input
              type="datetime-local"
              value={actionInputs[subTaskId] || ""}
              onChange={(e) => {
                const newInputs = { ...actionInputs };
                newInputs[subTaskId] = e.target.value;
                setActionInputs(newInputs);
              }}
            />
            <Button size="sm" onClick={() => handleAddReminder(subTaskId)}>
              OK
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        {subTasks.length > 0 ? (
          subTasks
            .filter((st) => st.statut !== "annulee")
            .map((subTask) => (
              <div key={subTask.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Checkbox
                            checked={subTask.statut === "terminee"}
                            onCheckedChange={() => handleToggleSubTask(subTask.id, subTask.statut)}
                            disabled={subTask.created_by !== currentEmployeeId}
                          />
                        </div>
                      </TooltipTrigger>
                      {subTask.created_by !== currentEmployeeId && (
                        <TooltipContent>
                          Seul {subTask.creator_employee?.prenom} {subTask.creator_employee?.nom} peut clôturer cette sous-tâche.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
                
                {/* Actions rapides */}
                <div className="flex gap-1 ml-8">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3"
                    onClick={() => {
                      const newActiveActions = { ...activeActions };
                      newActiveActions[subTask.id] = activeActions[subTask.id] === "comment" ? "" : "comment";
                      setActiveActions(newActiveActions);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Commenter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3"
                    onClick={() => {
                      const newActiveActions = { ...activeActions };
                      newActiveActions[subTask.id] = activeActions[subTask.id] === "date" ? "" : "date";
                      setActiveActions(newActiveActions);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Modifier date
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3"
                    onClick={() => {
                      const newActiveActions = { ...activeActions };
                      newActiveActions[subTask.id] = activeActions[subTask.id] === "reminder" ? "" : "reminder";
                      setActiveActions(newActiveActions);
                    }}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Rappel
                  </Button>
                </div>
                
                {/* Input conditionnel */}
                {renderActionInput(subTask.id, activeActions[subTask.id])}
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
