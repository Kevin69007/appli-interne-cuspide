import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface TaskValidationActionsProps {
  task: any;
  currentEmployeeId: string | null;
  currentEmployeeName: string;
  onUpdate: () => void;
  onClose?: () => void;
}

export const TaskValidationActions = ({
  task,
  currentEmployeeId,
  currentEmployeeName,
  onUpdate,
  onClose,
}: TaskValidationActionsProps) => {
  const { t } = useTranslation('tasks');
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const isCreator = task.created_by === currentEmployeeId;
  const isPendingValidation = task.statut === "en_attente_validation";

  if (!isCreator || !isPendingValidation) return null;

  const completedByName = task.completed_by_employee 
    ? `${task.completed_by_employee.prenom} ${task.completed_by_employee.nom}`
    : "un collaborateur";

  const handleValidate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          statut: "terminee",
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notify the assignee that their work was validated
      if (task.assigned_to && task.assigned_to !== currentEmployeeId) {
        await supabase.from("notifications").insert({
          employee_id: task.assigned_to,
          titre: "✅ Tâche validée",
          message: `${currentEmployeeName} a validé la clôture de la tâche : ${task.titre}`,
          type: "task_validated",
          url: "/taches",
        });
      }

      toast.success(t('validation.validated'));
      onUpdate();
      onClose?.();
    } catch (error) {
      console.error("Error validating task:", error);
      toast.error(t('validation.validateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      toast.error(t('validation.commentRequired'));
      return;
    }

    setLoading(true);
    try {
      // Add the rejection comment to the task comments
      const { data: currentTask } = await supabase
        .from("tasks")
        .select("commentaires")
        .eq("id", task.id)
        .single();

      const existingComments = Array.isArray(currentTask?.commentaires) ? currentTask.commentaires : [];
      const updatedComments = [
        ...existingComments,
        {
          auteur_id: currentEmployeeId,
          auteur_nom: currentEmployeeName,
          texte: `🔄 Tâche réaffectée : ${rejectComment}`,
          date: new Date().toISOString(),
          is_rejection: true,
        },
      ];

      const { error } = await supabase
        .from("tasks")
        .update({ 
          statut: "en_cours",
          completed_at: null,
          completed_by: null,
          commentaires: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notify the assignee that the task was reassigned
      if (task.assigned_to && task.assigned_to !== currentEmployeeId) {
        await supabase.from("notifications").insert({
          employee_id: task.assigned_to,
          titre: "🔄 Tâche réaffectée",
          message: `${currentEmployeeName} vous a réaffecté la tâche : ${task.titre}. Motif : ${rejectComment}`,
          type: "task_reassigned",
          url: "/taches",
        });
      }

      toast.success(t('validation.reassigned'));
      setShowRejectDialog(false);
      setRejectComment("");
      onUpdate();
      onClose?.();
    } catch (error) {
      console.error("Error rejecting task:", error);
      toast.error(t('validation.reassignError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <h4 className="font-semibold text-amber-800 dark:text-amber-200">
            {t('validation.title')}
          </h4>
        </div>
        
        <p className="text-sm text-amber-700 dark:text-amber-300">
          {t('validation.completedBy', { name: completedByName })}
          {task.completed_at && (
            <span className="ml-1">
              {t('validation.completedOn', { date: format(new Date(task.completed_at), "d MMMM à HH:mm", { locale: fr }) })}
            </span>
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleValidate} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('validation.validate')}
          </Button>
          <Button 
            onClick={() => setShowRejectDialog(true)} 
            disabled={loading}
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('validation.reassign')}
          </Button>
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('validation.reassignTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t('validation.reassignDescription')}
            </p>
            <Textarea
              placeholder={t('validation.reassignPlaceholder')}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)} disabled={loading}>
              {t('common:cancel')}
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={loading || !rejectComment.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('validation.confirmReassign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
