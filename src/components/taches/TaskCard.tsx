import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskDetailsDialog } from "./TaskDetailsDialog";

interface TaskCardProps {
  task: any;
  currentEmployeeId: string | null;
  onUpdate: () => void;
  isHelpRequest?: boolean;
}

export const TaskCard = ({ task, currentEmployeeId, onUpdate, isHelpRequest }: TaskCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

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

  const getStatusIcon = () => {
    if (task.statut === "terminee") {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

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
                {getStatusIcon()}
              </button>
              <h3 className={`font-semibold text-lg ${task.statut === "terminee" ? "line-through" : ""}`}>
                {task.titre}
              </h3>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground ml-8">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 ml-8">
              <Badge className={getPriorityColor(task.priorite)}>{task.priorite}</Badge>

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

              {task.depend_de && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Dépendance
                </Badge>
              )}

              {isHelpRequest && task.assigned_employee && (
                <span className="text-sm text-muted-foreground">
                  Pour : {task.assigned_employee.prenom} {task.assigned_employee.nom}
                </span>
              )}
            </div>
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
