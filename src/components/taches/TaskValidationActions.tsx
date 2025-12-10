import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Clock, Calendar, X } from "lucide-react";
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
  const [showRejectDateDialog, setShowRejectDateDialog] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [dateRejectComment, setDateRejectComment] = useState("");

  // Le validateur est soit validation_responsable_id, soit le créateur si non défini
  const validationResponsableId = task.validation_responsable_id || task.created_by;
  const isValidator = validationResponsableId === currentEmployeeId;
  const isCreator = task.created_by === currentEmployeeId;
  const isPendingValidation = task.statut === "en_attente_validation";
  const isDateChangePending = task.date_change_pending === true;

  // Afficher si l'utilisateur est validateur (pour validation) ou créateur (pour date change)
  if ((!isValidator || !isPendingValidation) && (!isCreator || !isDateChangePending)) return null;

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

  const handleApproveDateChange = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          date_echeance: task.date_change_new_date,
          date_change_pending: false,
          date_change_requested_by: null,
          date_change_requested_at: null,
          date_change_original_date: null,
          date_change_new_date: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notify requester
      if (task.date_change_requested_by) {
        await supabase.from("notifications").insert({
          employee_id: task.date_change_requested_by,
          titre: "✅ Changement de date approuvé",
          message: `${currentEmployeeName} a approuvé le changement de date pour : ${task.titre}`,
          type: "task_date_change_approved",
          url: "/taches",
        });
      }

      toast.success("Changement de date approuvé");
      onUpdate();
      onClose?.();
    } catch (error) {
      console.error("Error approving date change:", error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDateChange = async () => {
    if (!dateRejectComment.trim()) {
      toast.error("Veuillez indiquer un motif de refus");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          date_change_pending: false,
          date_change_requested_by: null,
          date_change_requested_at: null,
          date_change_original_date: null,
          date_change_new_date: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notify requester
      if (task.date_change_requested_by) {
        await supabase.from("notifications").insert({
          employee_id: task.date_change_requested_by,
          titre: "❌ Changement de date refusé",
          message: `${currentEmployeeName} a refusé le changement de date pour : ${task.titre}. Motif : ${dateRejectComment}`,
          type: "task_date_change_rejected",
          url: "/taches",
        });
      }

      toast.success("Changement de date refusé");
      setShowRejectDateDialog(false);
      setDateRejectComment("");
      onUpdate();
      onClose?.();
    } catch (error) {
      console.error("Error rejecting date change:", error);
      toast.error("Erreur lors du refus");
    } finally {
      setLoading(false);
    }
  };

  const dateRequesterName = task.date_change_requester
    ? `${task.date_change_requester.prenom} ${task.date_change_requester.nom}`
    : "un collaborateur";

  return (
    <>
      {/* Date Change Validation Section */}
      {isDateChangePending && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
              Changement de date demandé
            </h4>
          </div>
          
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{dateRequesterName}</strong> demande de déplacer cette tâche
            {task.date_change_original_date && task.date_change_new_date && (
              <span className="block mt-1">
                Du <strong>{format(new Date(task.date_change_original_date), "d MMMM yyyy", { locale: fr })}</strong> au{" "}
                <strong>{format(new Date(task.date_change_new_date), "d MMMM yyyy", { locale: fr })}</strong>
              </span>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleApproveDateChange} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approuver
            </Button>
            <Button 
              onClick={() => setShowRejectDateDialog(true)} 
              disabled={loading}
              variant="outline"
              className="border-blue-500 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <X className="h-4 w-4 mr-2" />
              Refuser
            </Button>
          </div>
        </div>
      )}

      {/* Task Completion Validation Section */}
      {isPendingValidation && (
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
      )}

      {/* Reject Task Dialog */}
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

      {/* Reject Date Change Dialog */}
      <Dialog open={showRejectDateDialog} onOpenChange={setShowRejectDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le changement de date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Indiquez pourquoi vous refusez ce changement de date. La personne sera notifiée.
            </p>
            <Textarea
              placeholder="Expliquez le motif du refus..."
              value={dateRejectComment}
              onChange={(e) => setDateRejectComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDateDialog(false)} disabled={loading}>
              Annuler
            </Button>
            <Button 
              onClick={handleRejectDateChange} 
              disabled={loading || !dateRejectComment.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
