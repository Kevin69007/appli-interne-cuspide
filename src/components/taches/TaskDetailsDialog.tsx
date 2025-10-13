import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, User, CheckCircle2, XCircle, RotateCcw, Send } from "lucide-react";
import { TaskComments } from "./TaskComments";
import { SubTasksList } from "./SubTasksList";
import { RappelsList } from "./RappelsList";
import { BoomerangSendDialog } from "./BoomerangSendDialog";
import { BoomerangHistoryTimeline } from "./BoomerangHistoryTimeline";
import { BoomerangTimer } from "./BoomerangTimer";

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
  const [showBoomerangDialog, setShowBoomerangDialog] = useState(false);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");

  useEffect(() => {
    fetchCurrentEmployeeName();
  }, [currentEmployeeId]);

  const fetchCurrentEmployeeName = async () => {
    if (!currentEmployeeId) return;
    const { data } = await supabase
      .from("employees")
      .select("nom, prenom")
      .eq("id", currentEmployeeId)
      .single();
    if (data) {
      setCurrentEmployeeName(`${data.prenom} ${data.nom}`);
    }
  };

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

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette tâche ? Elle restera visible dans l'historique.")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ statut: "annulee" })
        .eq("id", task.id);

      if (error) throw error;

      toast.success("Tâche annulée");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error canceling task:", error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBoomerang = async () => {
    setLoading(true);
    try {
      const historyEntry = {
        from: currentEmployeeId,
        to: task.boomerang_original_owner,
        from_name: currentEmployeeName,
        to_name: task.boomerang_owner ? `${task.boomerang_owner.prenom} ${task.boomerang_owner.nom}` : "",
        sent_at: task.boomerang_history?.[task.boomerang_history.length - 1]?.sent_at || new Date().toISOString(),
        returned_at: new Date().toISOString(),
        auto_return: false,
      };

      const { error } = await supabase
        .from("tasks")
        .update({
          boomerang_active: false,
          boomerang_current_holder: null,
          assigned_to: task.boomerang_original_owner,
          boomerang_history: [...(task.boomerang_history || []), historyEntry],
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notification au propriétaire
      await supabase.from("notifications").insert({
        employee_id: task.boomerang_original_owner,
        titre: "🪃 Boomerang retourné",
        message: `${currentEmployeeName} vous a renvoyé le boomerang : ${task.titre}`,
        type: "boomerang_returned",
        url: "/taches",
      });

      toast.success("Boomerang retourné avec succès");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error returning boomerang:", error);
      toast.error("Erreur lors du retour du boomerang");
    } finally {
      setLoading(false);
    }
  };

  const handleRecallBoomerang = async () => {
    if (!confirm("Êtes-vous sûr de vouloir récupérer ce boomerang immédiatement ?")) return;

    setLoading(true);
    try {
      const historyEntry = {
        from: task.boomerang_current_holder,
        to: currentEmployeeId,
        from_name: task.boomerang_holder ? `${task.boomerang_holder.prenom} ${task.boomerang_holder.nom}` : "",
        to_name: currentEmployeeName,
        sent_at: task.boomerang_history?.[task.boomerang_history.length - 1]?.sent_at || new Date().toISOString(),
        returned_at: new Date().toISOString(),
        recalled: true,
      };

      const { error } = await supabase
        .from("tasks")
        .update({
          boomerang_active: false,
          boomerang_current_holder: null,
          assigned_to: currentEmployeeId,
          boomerang_history: [...(task.boomerang_history || []), historyEntry],
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notification au détenteur
      await supabase.from("notifications").insert({
        employee_id: task.boomerang_current_holder,
        titre: "🪃 Boomerang rappelé",
        message: `${currentEmployeeName} a récupéré son boomerang : ${task.titre}`,
        type: "boomerang_recalled",
        url: "/taches",
      });

      toast.success("Boomerang récupéré");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error recalling boomerang:", error);
      toast.error("Erreur lors de la récupération");
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

  const isBoomerangHolder = task.boomerang_active && task.boomerang_current_holder === currentEmployeeId;
  const isBoomerangOwner = task.boomerang_active && task.boomerang_original_owner === currentEmployeeId;
  const canSendBoomerang = !task.boomerang_active && (task.assigned_to === currentEmployeeId || task.created_by === currentEmployeeId);

  return (
    <>
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
              {task.statut !== "annulee" && !task.boomerang_active && (
                <Button variant="ghost" size="icon" onClick={handleCancel} title="Annuler la tâche">
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              )}
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
              ) : task.statut === "annulee" ? (
                <Badge className="bg-red-500/20 text-red-700">
                  <XCircle className="h-3 w-3 mr-1" />
                  Annulée
                </Badge>
              ) : (
                <Badge variant="outline">En cours</Badge>
              )}
              {task.boomerang_active && (
                <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
                  🪃 Mode Boomerang
                </Badge>
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

              {task.creator_employee && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Créé par : {task.creator_employee.prenom} {task.creator_employee.nom}
                </div>
              )}
            </div>

            {/* Boomerang Info */}
            {task.boomerang_active && (
              <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">🪃 Boomerang actif</h4>
                  {task.boomerang_deadline && <BoomerangTimer deadline={task.boomerang_deadline} />}
                </div>
                <div className="space-y-2 text-sm">
                  {isBoomerangHolder && (
                    <>
                      <p className="text-muted-foreground">
                        Envoyé par : {task.boomerang_owner?.prenom} {task.boomerang_owner?.nom}
                      </p>
                      <p className="text-destructive font-medium">
                        ⚠️ Vous ne pouvez pas clôturer cette tâche. Vous devez la renvoyer au propriétaire.
                      </p>
                      <Button onClick={handleReturnBoomerang} disabled={loading} className="w-full mt-2">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Renvoyer le boomerang
                      </Button>
                    </>
                  )}
                  {isBoomerangOwner && (
                    <>
                      <p className="text-muted-foreground">
                        Détenu par : {task.boomerang_holder?.prenom} {task.boomerang_holder?.nom}
                      </p>
                      <Button onClick={handleRecallBoomerang} disabled={loading} variant="outline" className="w-full mt-2">
                        Récupérer immédiatement
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Boomerang History */}
            {task.boomerang_history && task.boomerang_history.length > 0 && (
              <div className="border rounded-lg p-4">
                <BoomerangHistoryTimeline history={task.boomerang_history} />
              </div>
            )}

            {/* Send Boomerang Button */}
            {canSendBoomerang && task.statut !== "annulee" && task.statut !== "terminee" && (
              <Button onClick={() => setShowBoomerangDialog(true)} variant="secondary" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                🪃 Envoyer en mode Boomerang
              </Button>
            )}

            {/* Deadline Update - Disabled for boomerang holders */}
            {!isBoomerangOwner && task.statut !== "annulee" && (
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
            )}

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

      <BoomerangSendDialog
        open={showBoomerangDialog}
        onOpenChange={setShowBoomerangDialog}
        taskId={task.id}
        taskTitle={task.titre}
        currentEmployeeId={currentEmployeeId || ""}
        onBoomerangSent={() => {
          onUpdate();
          onOpenChange(false);
        }}
      />
    </>
  );
};
