import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EmployeeScheduleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  date: Date;
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
  heure_debut: string;
  heure_fin: string;
  commentaire: string | null;
}

export const EmployeeScheduleDetailsDialog = ({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  date,
}: EmployeeScheduleDetailsDialogProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Fetch work schedules for this employee on this date
    const { data: schedulesData } = await supabase
      .from("work_schedules")
      .select("id, heure_debut, heure_fin, commentaire")
      .eq("employee_id", employeeId)
      .eq("date", dateStr);

    setTasks(tasksData || []);
    setAbsences(absencesData || []);
    setSchedules(schedulesData || []);
    setLoading(false);
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

  return (
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
                      <div className="font-medium">
                        {schedule.heure_debut.slice(0, 5)} - {schedule.heure_fin.slice(0, 5)}
                      </div>
                      {schedule.commentaire && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {schedule.commentaire}
                        </div>
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
  );
};
