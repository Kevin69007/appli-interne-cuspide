import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { EditScheduleDialog } from "./EditScheduleDialog";

interface EmployeeScheduleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  date: Date;
  onSchedulesUpdated?: () => void;
}

interface Task {
  id: string;
  titre: string;
  statut: string;
  priorite: string;
  date_echeance: string;
}

interface Absence {
  id: string;
  detail: string;
  statut_validation: string;
  type_absence: string | null;
}

interface Schedule {
  id: string;
  employee_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  pause_minutes: number | null;
  commentaire: string | null;
  schedule_group_id: string | null;
}

export const EmployeeScheduleDetailsDialog = ({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  date,
  onSchedulesUpdated,
}: EmployeeScheduleDetailsDialogProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);
  const [deleteMode, setDeleteMode] = useState<"single" | "series">("single");

  useEffect(() => {
    if (open && employeeId && date) {
      fetchData();
    }
  }, [open, employeeId, date]);

  const fetchData = async () => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");

    // Fetch tasks for this employee on this date
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("id, titre, statut, priorite, date_echeance")
      .eq("assigned_to", employeeId)
      .eq("date_echeance", dateStr)
      .neq("statut", "annulee");

    // Fetch absences for this employee on this date
    const { data: absencesData } = await supabase
      .from("agenda_entries")
      .select("id, detail, statut_validation, type_absence")
      .eq("employee_id", employeeId)
      .eq("date", dateStr)
      .eq("categorie", "absence");

    // Fetch work schedules for this employee on this date with all needed fields
    const { data: schedulesData } = await supabase
      .from("work_schedules")
      .select("id, employee_id, date, heure_debut, heure_fin, pause_minutes, commentaire, schedule_group_id")
      .eq("employee_id", employeeId)
      .eq("date", dateStr);

    setTasks(tasksData || []);
    setAbsences(absencesData || []);
    // Sort schedules chronologically by start time
    setSchedules((schedulesData || []).sort((a, b) => 
      a.heure_debut.localeCompare(b.heure_debut)
    ));
    setLoading(false);
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;
    
    try {
      if (deleteMode === "series" && deletingSchedule.schedule_group_id) {
        await supabase
          .from("work_schedules")
          .delete()
          .eq("schedule_group_id", deletingSchedule.schedule_group_id);
        toast.success("Série supprimée");
      } else {
        await supabase
          .from("work_schedules")
          .delete()
          .eq("id", deletingSchedule.id);
        toast.success("Horaire supprimé");
      }
      fetchData();
      onSchedulesUpdated?.();
      setDeletingSchedule(null);
      setDeleteMode("single");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "terminee":
        return <Badge variant="default" className="bg-green-500">Terminée</Badge>;
      case "en_cours":
        return <Badge variant="default" className="bg-blue-500">En cours</Badge>;
      case "a_faire":
        return <Badge variant="secondary">À faire</Badge>;
      case "en_attente_validation":
        return <Badge variant="default" className="bg-yellow-500">En validation</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPriorityBadge = (priorite: string) => {
    switch (priorite) {
      case "haute":
        return <Badge variant="destructive">Haute</Badge>;
      case "normale":
        return <Badge variant="secondary">Normale</Badge>;
      case "basse":
        return <Badge variant="outline">Basse</Badge>;
      default:
        return null;
    }
  };

  // Convert schedule to the format expected by EditScheduleDialog
  const scheduleForEdit = editingSchedule ? {
    ...editingSchedule,
    employees: { nom: employeeName.split(" ")[0] || "", prenom: employeeName.split(" ")[1] || "", equipe: null }
  } : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {employeeName} - {format(date, "EEEE d MMMM yyyy", { locale: fr })}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Horaires */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horaires de travail
                </h4>
                {schedules.length > 0 ? (
                  <div className="space-y-2">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {schedule.heure_debut.slice(0, 5)} - {schedule.heure_fin.slice(0, 5)}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => setEditingSchedule(schedule)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingSchedule(schedule);
                                setDeleteMode("single");
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {schedule.commentaire && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {schedule.commentaire}
                          </div>
                        )}
                        {schedule.schedule_group_id && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Récurrent
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pas d'horaire prévu</p>
                )}
              </div>

              {/* Absences */}
              {absences.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Absences
                  </h4>
                  <div className="space-y-2">
                    {absences.map((absence) => (
                      <div
                        key={absence.id}
                        className={`rounded-lg p-3 ${
                          absence.statut_validation === "valide"
                            ? "bg-purple-500/10 border border-purple-500/20"
                            : "bg-yellow-500/10 border border-yellow-500/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {absence.type_absence || absence.detail || "Absence"}
                          </span>
                          <Badge
                            variant={absence.statut_validation === "valide" ? "default" : "secondary"}
                            className={
                              absence.statut_validation === "valide"
                                ? "bg-purple-500"
                                : "bg-yellow-500"
                            }
                          >
                            {absence.statut_validation === "valide" ? "Validée" : "En attente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tâches */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Tâches du jour ({tasks.length})
                </h4>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
                      >
                        <div className="font-medium">{task.titre}</div>
                        <div className="flex gap-2 mt-2">
                          {getStatusBadge(task.statut)}
                          {getPriorityBadge(task.priorite)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune tâche prévue</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      {scheduleForEdit && (
        <EditScheduleDialog
          open={!!editingSchedule}
          onOpenChange={(open) => !open && setEditingSchedule(null)}
          schedule={scheduleForEdit}
          onScheduleUpdated={() => {
            fetchData();
            onSchedulesUpdated?.();
            setEditingSchedule(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSchedule} onOpenChange={(open) => !open && setDeletingSchedule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'horaire</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Êtes-vous sûr de vouloir supprimer cet horaire ?</p>
                {deletingSchedule?.schedule_group_id && (
                  <RadioGroup value={deleteMode} onValueChange={(v) => setDeleteMode(v as "single" | "series")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="delete-single" />
                      <Label htmlFor="delete-single">Uniquement cet horaire</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="series" id="delete-series" />
                      <Label htmlFor="delete-series">Toute la série récurrente</Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingSchedule(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchedule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
