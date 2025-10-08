import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, User, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { TaskComments } from "./TaskComments";
import { SubTasksList } from "./SubTasksList";
import { RappelsList } from "./RappelsList";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  currentEmployeeId: string | null;
  onUpdate: () => void;
}

export const TaskDetailsDialog = ({
  open,
  onOpenChange,
  task,
  currentEmployeeId,
  onUpdate,
}: TaskDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [newDeadline, setNewDeadline] = useState(task.date_echeance);

  const handleUpdateDeadline = async () => {
    if (!newDeadline) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ date_echeance: newDeadline })
        .eq("id", task.id);

      if (error) throw error;

      toast.success("Date d'échéance mise à jour");
      onUpdate();
    } catch (error) {
      console.error("Error updating deadline:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ statut: "annulee" })
        .eq("id", task.id);

      if (error) throw error;

      toast.success("Tâche supprimée");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{task.titre}</DialogTitle>
              {task.description && (
                <p className="text-muted-foreground mt-2">{task.description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={getPriorityColor(task.priorite)}>{task.priorite}</Badge>
            {task.statut === "terminee" ? (
              <Badge className="bg-green-500/20 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Terminée
              </Badge>
            ) : (
              <Badge variant="outline">En cours</Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Échéance : {new Date(task.date_echeance).toLocaleDateString("fr-FR")}
              </span>
            </div>

            {task.assigned_employee && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  Assigné à : {task.assigned_employee.prenom} {task.assigned_employee.nom}
                </span>
              </div>
            )}

            {task.dependency_employee && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>
                  Dépend de : {task.dependency_employee.prenom} {task.dependency_employee.nom}
                </span>
              </div>
            )}

            {task.creator_employee && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Créé par : {task.creator_employee.prenom} {task.creator_employee.nom}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-deadline">Modifier la date d'échéance</Label>
            <div className="flex gap-2">
              <Input
                id="new-deadline"
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
              <Button onClick={handleUpdateDeadline} disabled={loading || newDeadline === task.date_echeance}>
                Mettre à jour
              </Button>
            </div>
          </div>

          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comments">
                Commentaires ({task.commentaires?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="subtasks">Sous-tâches</TabsTrigger>
              <TabsTrigger value="reminders">Rappels</TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              <TaskComments
                taskId={task.id}
                comments={task.commentaires || []}
                currentEmployeeId={currentEmployeeId}
                onUpdate={onUpdate}
              />
            </TabsContent>

            <TabsContent value="subtasks">
              <SubTasksList
                parentTaskId={task.id}
                currentEmployeeId={currentEmployeeId}
                onUpdate={onUpdate}
              />
            </TabsContent>

            <TabsContent value="reminders">
              <RappelsList
                taskId={task.id}
                rappels={task.rappels || []}
                onUpdate={onUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
