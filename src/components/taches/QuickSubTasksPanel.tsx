import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, MessageSquare, Bell, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuickSubTasksPanelProps {
  parentTaskId: string;
  currentEmployeeId: string | null;
  onUpdate: () => void;
}

export const QuickSubTasksPanel = ({ parentTaskId, currentEmployeeId, onUpdate }: QuickSubTasksPanelProps) => {
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeActions, setActiveActions] = useState<{[key: string]: string}>({});
  const [actionInputs, setActionInputs] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isExpanded) {
      fetchSubTasks();
    }
  }, [parentTaskId, isExpanded]);

  const fetchSubTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("parent_task_id", parentTaskId)
      .neq("statut", "annulee")
      .order("created_at");

    if (!error && data) {
      setSubTasks(data);
    }
  };

  const handleToggleSubTask = async (subTaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "terminee" ? "en_cours" : "terminee";

    const { error } = await supabase
      .from("tasks")
      .update({ statut: newStatus })
      .eq("id", subTaskId);

    if (!error) {
      toast.success(newStatus === "terminee" ? "Sous-tâche terminée" : "Sous-tâche réouverte");
      fetchSubTasks();
      onUpdate();
    }
  };

  const handleAddComment = async (subTaskId: string) => {
    const comment = actionInputs[subTaskId];
    if (!comment?.trim() || !currentEmployeeId) return;

    // Fetch current task to get existing comments
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("commentaires")
      .eq("id", subTaskId)
      .single();

    if (!currentTask) return;

    // Fetch employee name
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
      setActiveActions({});
      setActionInputs({});
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
      setActiveActions({});
      setActionInputs({});
      fetchSubTasks();
      onUpdate();
    }
  };

  const handleAddReminder = async (subTaskId: string) => {
    const reminderDate = actionInputs[subTaskId];
    if (!reminderDate) return;

    // Fetch current task to get existing reminders
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
      setActiveActions({});
      setActionInputs({});
      fetchSubTasks();
      onUpdate();
    }
  };

  const renderActionInput = (subTaskId: string, action: string) => {
    switch (action) {
      case "comment":
        return (
          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <Textarea
              placeholder="Votre commentaire..."
              value={actionInputs[subTaskId] || ""}
              onChange={(e) => setActionInputs({ ...actionInputs, [subTaskId]: e.target.value })}
              className="min-h-[60px]"
            />
            <Button size="sm" onClick={() => handleAddComment(subTaskId)}>
              Envoyer
            </Button>
          </div>
        );
      case "date":
        return (
          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <Input
              type="date"
              value={actionInputs[subTaskId] || ""}
              onChange={(e) => setActionInputs({ ...actionInputs, [subTaskId]: e.target.value })}
            />
            <Button size="sm" onClick={() => handleUpdateDeadline(subTaskId)}>
              OK
            </Button>
          </div>
        );
      case "reminder":
        return (
          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <Input
              type="datetime-local"
              value={actionInputs[subTaskId] || ""}
              onChange={(e) => setActionInputs({ ...actionInputs, [subTaskId]: e.target.value })}
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

  const completedCount = subTasks.filter((st) => st.statut === "terminee").length;
  const totalCount = subTasks.length;

  return (
    <div className="mt-2 border rounded-lg" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            ✓ {completedCount}/{totalCount} sous-tâches
          </Badge>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <div className="p-3 space-y-2 border-t">
          {subTasks.length > 0 ? (
            subTasks.map((subTask) => (
              <div key={subTask.id} className="border rounded-lg p-2 space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={subTask.statut === "terminee"}
                    onCheckedChange={() => handleToggleSubTask(subTask.id, subTask.statut)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <span
                      className={`text-sm ${
                        subTask.statut === "terminee" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {subTask.titre}
                    </span>
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActions({ [subTask.id]: "comment" });
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActions({ [subTask.id]: "date" });
                        }}
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActions({ [subTask.id]: "reminder" });
                        }}
                      >
                        <Bell className="h-3 w-3" />
                      </Button>
                    </div>
                    {activeActions[subTask.id] && renderActionInput(subTask.id, activeActions[subTask.id])}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Aucune sous-tâche</p>
          )}
        </div>
      )}
    </div>
  );
};
