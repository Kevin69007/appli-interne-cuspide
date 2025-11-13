import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Clock, MessageSquare, Calendar, Bell, Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskDetailsDialog } from "./TaskDetailsDialog";
import { BoomerangTimer } from "./BoomerangTimer";
import { QuickSubTasksPanel } from "./QuickSubTasksPanel";

interface TaskCardProps {
  task: any;
  currentEmployeeId: string | null;
  onUpdate: () => void;
  isHelpRequest?: boolean;
  isMaintenance?: boolean;
  highlightTerm?: string;
}

const getPriorityColor = (priorite: string) => {
  switch (priorite) {
    case "haute":
      return "bg-red-500/20 text-red-700 dark:text-red-400";
    case "normale":
      return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
    case "basse":
      return "bg-green-500/20 text-green-700 dark:text-green-400";
    default:
      return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
  }
};

const getStatusIcon = (statut: string) => {
  if (statut === "terminee") {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  }
  return <Circle className="h-5 w-5 text-muted-foreground" />;
};

export const TaskCard = ({ task, currentEmployeeId, onUpdate, isHelpRequest, isMaintenance, highlightTerm }: TaskCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [subTasksCount, setSubTasksCount] = useState({ total: 0, completed: 0 });
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState<string>("");
  const [showQuickSubTaskInput, setShowQuickSubTaskInput] = useState(false);
  const [quickSubTaskTitle, setQuickSubTaskTitle] = useState("");

  const fetchSubTasksCount = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, statut")
      .eq("parent_task_id", task.id)
      .neq("statut", "annulee");

    if (!error && data) {
      const completed = data.filter((st) => st.statut === "terminee").length;
      setSubTasksCount({ total: data.length, completed });
    }
  }, [task.id]);

  useEffect(() => {
    fetchSubTasksCount();
  }, [fetchSubTasksCount]);

  // Highlight search terms in text
  const highlightText = (text: string) => {
    if (!highlightTerm || !text) return text;
    
    const regex = new RegExp(`(${highlightTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  const priorityColor = useMemo(() => getPriorityColor(task.priorite), [task.priorite]);
  const statusIcon = useMemo(() => getStatusIcon(task.statut), [task.statut]);

  const toggleStatus = async () => {
    const newStatut = task.statut === "terminee" ? "en_cours" : "terminee";

    const { error } = await supabase
      .from("tasks")
      .update({ statut: newStatut })
      .eq("id", task.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    toast.success(newStatut === "terminee" ? "Tâche terminée !" : "Tâche réouverte");
    onUpdate();
  };

  const handleAddComment = async () => {
    const comment = actionInput;
    if (!comment?.trim() || !currentEmployeeId) return;

    const { data: currentTask } = await supabase
      .from("tasks")
      .select("commentaires")
      .eq("id", task.id)
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
      .eq("id", task.id);

    if (!error) {
      toast.success("Commentaire ajouté");
      setActiveAction(null);
      setActionInput("");
      onUpdate();
    }
  };

  const handleUpdateDeadline = async () => {
    const newDate = actionInput;
    if (!newDate) return;

    const { error } = await supabase
      .from("tasks")
      .update({ date_echeance: newDate })
      .eq("id", task.id);

    if (!error) {
      toast.success("Date mise à jour");
      setActiveAction(null);
      setActionInput("");
      onUpdate();
    }
  };

  const handleAddReminder = async () => {
    const reminderDate = actionInput;
    if (!reminderDate) return;

    const { data: currentTask } = await supabase
      .from("tasks")
      .select("rappels")
      .eq("id", task.id)
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
      .eq("id", task.id);

    if (!error) {
      toast.success("Rappel ajouté");
      setActiveAction(null);
      setActionInput("");
      onUpdate();
    }
  };

  const handleAddQuickSubTask = async () => {
    if (!quickSubTaskTitle.trim() || !currentEmployeeId) return;

    try {
      const { data: parentTask } = await supabase
        .from("tasks")
        .select("assigned_to, date_echeance")
        .eq("id", task.id)
        .single();

      if (!parentTask) throw new Error("Parent task not found");

      const { error } = await supabase.from("tasks").insert([
        {
          titre: quickSubTaskTitle,
          created_by: currentEmployeeId,
          assigned_to: parentTask.assigned_to,
          date_echeance: parentTask.date_echeance,
          parent_task_id: task.id,
          statut: "en_cours",
        },
      ]);

      if (error) throw error;

      toast.success("Sous-tâche ajoutée");
      setQuickSubTaskTitle("");
      setShowQuickSubTaskInput(false);
      fetchSubTasksCount();
      onUpdate();
    } catch (error) {
      console.error("Error adding subtask:", error);
      toast.error("Erreur lors de l'ajout de la sous-tâche");
    }
  };

  const renderActionInput = () => {
    if (!activeAction) return null;

    switch (activeAction) {
      case "comment":
        return (
          <div className="flex gap-2 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
            <Textarea
              placeholder="Votre commentaire..."
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              className="min-h-[60px]"
            />
            <Button size="sm" onClick={handleAddComment}>
              Envoyer
            </Button>
          </div>
        );
      case "date":
        return (
          <div className="flex gap-2 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
            <Input
              type="date"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
            />
            <Button size="sm" onClick={handleUpdateDeadline}>
              OK
            </Button>
          </div>
        );
      case "reminder":
        return (
          <div className="flex gap-2 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
            <Input
              type="datetime-local"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
            />
            <Button size="sm" onClick={handleAddReminder}>
              OK
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderQuickSubTaskInput = () => {
    if (!showQuickSubTaskInput) return null;

    return (
      <div className="flex gap-2 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
        <Input
          placeholder="Titre de la sous-tâche..."
          value={quickSubTaskTitle}
          onChange={(e) => setQuickSubTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddQuickSubTask();
            }
          }}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAddQuickSubTask} disabled={!quickSubTaskTitle.trim()}>
          Ajouter
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => {
            setShowQuickSubTaskInput(false);
            setQuickSubTaskTitle("");
          }}
        >
          Annuler
        </Button>
      </div>
    );
  };

  const isOverdue = new Date(task.date_echeance) < new Date() && task.statut !== "terminee";
  const daysUntilDue = Math.ceil(
    (new Date(task.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <Card
        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
          task.statut === "terminee" ? "opacity-60" : ""
        }`}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus();
                }}
                className="hover:scale-110 transition-transform"
              >
                {statusIcon}
              </button>
              <h3 className={`font-semibold text-lg ${task.statut === "terminee" ? "line-through" : ""}`}>
                {highlightText(task.titre)}
              </h3>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground ml-8">{highlightText(task.description)}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 ml-8">
              <Badge className={priorityColor}>{task.priorite}</Badge>

              {isMaintenance && task.machine_piece && (
                <Badge variant="outline" className="bg-purple-500/20 text-purple-700 dark:text-purple-400">
                  {task.maintenance_type === "machine" ? "🔧" : "🏠"} {task.machine_piece}
                </Badge>
              )}

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(task.date_echeance).toLocaleDateString("fr-FR")}
                  {isOverdue && <span className="text-red-600 ml-1">(En retard)</span>}
                  {!isOverdue && daysUntilDue >= 0 && daysUntilDue <= 3 && (
                    <span className="text-orange-600 ml-1">({daysUntilDue}j restants)</span>
                  )}
                </span>
              </div>

              {task.commentaires?.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{task.commentaires.length}</span>
                </div>
              )}

              {task.boomerang_active && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
                          🪃 Boomerang
                        </Badge>
                        <Info className="h-3 w-3 text-orange-700 dark:text-orange-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">
                        <strong>Mode Boomerang :</strong> Cette tâche a été déléguée temporairement à un collègue.
                        Elle reviendra automatiquement à son propriétaire après le délai défini.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {task.boomerang_active && task.boomerang_deadline && (
                <BoomerangTimer deadline={task.boomerang_deadline} />
              )}

              {subTasksCount.total > 0 && (
                <Badge variant="outline" className="text-xs">
                  ✓ {subTasksCount.completed}/{subTasksCount.total} sous-tâches
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1 ml-8 mt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAction(activeAction === "comment" ? null : "comment");
                  setActionInput("");
                }}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Commenter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAction(activeAction === "date" ? null : "date");
                  setActionInput("");
                }}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Modifier date
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAction(activeAction === "reminder" ? null : "reminder");
                  setActionInput("");
                }}
              >
                <Bell className="h-4 w-4 mr-1" />
                Rappel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickSubTaskInput(!showQuickSubTaskInput);
                  setActiveAction(null);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Sous-tâche
              </Button>
            </div>

            {/* Action Input */}
            {renderActionInput()}

            {/* Quick SubTask Input */}
            {renderQuickSubTaskInput()}

            {subTasksCount.total > 0 && (
              <QuickSubTasksPanel
                parentTaskId={task.id}
                currentEmployeeId={currentEmployeeId}
                totalCount={subTasksCount.total}
                completedCount={subTasksCount.completed}
                onUpdate={() => {
                  fetchSubTasksCount();
                  onUpdate();
                }}
              />
            )}
          </div>
        </div>
      </Card>

      <TaskDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={task}
        currentEmployeeId={currentEmployeeId}
        onUpdate={onUpdate}
      />
    </>
  );
};
