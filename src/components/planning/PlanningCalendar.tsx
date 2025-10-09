import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CreateScheduleDialog } from "./CreateScheduleDialog";
import { AddEventDialog } from "@/components/objectifs-primes/AddEventDialog";
import { CreateTaskDialog } from "@/components/taches/CreateTaskDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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

interface WorkSchedule {
  id: string;
  employee_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  pause_minutes: number;
  commentaire: string | null;
  schedule_group_id: string | null;
  employees: {
    nom: string;
    prenom: string;
    equipe: string | null;
  };
}

export const PlanningCalendar = () => {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const canManage = isAdmin || isManager;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [teams, setTeams] = useState<string[]>([]);
  const [scheduleToDelete, setScheduleToDelete] = useState<WorkSchedule | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'series'>('single');
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
    fetchTeams();
    if (user) {
      fetchCurrentEmployee();
    }
  }, [currentDate, selectedTeam, user]);

  const fetchCurrentEmployee = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setCurrentEmployeeId(data.id);
    }
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("employees")
      .select("equipe")
      .not("equipe", "is", null);
    
    if (data) {
      const uniqueTeams = [...new Set(data.map(e => e.equipe).filter(Boolean))] as string[];
      setTeams(uniqueTeams);
    }
  };

  const fetchSchedules = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let query = supabase
      .from("work_schedules")
      .select(`
        *,
        employees!inner(nom, prenom, equipe)
      `)
      .gte("date", startOfMonth.toISOString().split("T")[0])
      .lte("date", endOfMonth.toISOString().split("T")[0]);

    if (selectedTeam !== "all") {
      query = query.eq("employees.equipe", selectedTeam);
    }

    const { data, error } = await query;

    if (!error && data) {
      setSchedules(data as any);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // getDay() retourne 0 pour dimanche, 1 pour lundi, etc.
    // On veut que notre calendrier commence par lundi (1), donc on ajuste
    let startingDayOfWeek = firstDay.getDay();
    // Convertir pour que lundi = 0, mardi = 1, ..., dimanche = 6
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    // Ajouter les cases vides pour les jours avant le début du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Ajouter tous les jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getSchedulesForDate = (date: Date | null) => {
    if (!date) return [];
    // Utiliser le format YYYY-MM-DD sans conversion UTC pour éviter les décalages
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return schedules.filter((s) => s.date === dateStr);
  };

  const handleDayClick = (date: Date, isShiftKey: boolean) => {
    if (canManage) {
      setSelectedDate(date);
      if (isShiftKey) {
        setShowEventDialog(true);
      } else {
        setShowCreateDialog(true);
      }
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    let query = supabase.from("work_schedules").delete();

    if (deleteMode === 'single') {
      query = query.eq("id", scheduleToDelete.id);
    } else {
      // Supprimer toute la série
      if (!scheduleToDelete.schedule_group_id) {
        toast.error("Cet horaire n'appartient à aucune série");
        return;
      }
      query = query.eq("schedule_group_id", scheduleToDelete.schedule_group_id);
    }

    const { error } = await query;

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } else {
      toast.success(deleteMode === 'single' ? "Horaire supprimé" : "Série supprimée");
      fetchSchedules();
    }
    setScheduleToDelete(null);
    setDeleteMode('single');
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold capitalize min-w-[200px] text-center">
              {monthName}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les équipes</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un planning
            </Button>
            <Button onClick={() => {
              setSelectedDate(new Date());
              setShowEventDialog(true);
            }} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un événement
            </Button>
            <Button onClick={() => setShowMaintenanceDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche d'entretien
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day} className="text-center font-semibold text-sm py-2">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          const daySchedules = getSchedulesForDate(date);
          const isToday = date?.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              onClick={(e) => date && handleDayClick(date, e.shiftKey)}
              className={`min-h-[120px] border rounded-lg p-2 ${
                date
                  ? canManage
                    ? "cursor-pointer hover:bg-accent/50"
                    : "cursor-default"
                  : "bg-muted/30"
              } ${isToday ? "ring-2 ring-primary" : ""}`}
              title={canManage && date ? "Cliquez pour ajouter un planning, Shift+Clic pour ajouter un événement" : ""}
            >
              {date && (
                <>
                  <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                  <div className="space-y-1">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="text-xs bg-primary/10 rounded px-1 py-0.5 group relative"
                        title={`${schedule.employees.prenom} ${schedule.employees.nom}: ${schedule.heure_debut} - ${schedule.heure_fin}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {schedule.employees.prenom} {schedule.employees.nom}
                            </div>
                            <div className="text-muted-foreground">
                              {schedule.heure_debut.slice(0, 5)} - {schedule.heure_fin.slice(0, 5)}
                            </div>
                          </div>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScheduleToDelete(schedule);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {canManage && (
        <>
          <CreateScheduleDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onScheduleCreated={fetchSchedules}
          />
          {selectedDate && (
            <AddEventDialog
              open={showEventDialog}
              onOpenChange={setShowEventDialog}
              selectedDate={selectedDate}
              onEventAdded={fetchSchedules}
            />
          )}
          <CreateTaskDialog
            open={showMaintenanceDialog}
            onOpenChange={setShowMaintenanceDialog}
            currentEmployeeId={currentEmployeeId}
            onTaskCreated={fetchSchedules}
            canAssignOthers={true}
            isMaintenance={true}
          />
        </>
      )}

      <AlertDialog open={!!scheduleToDelete} onOpenChange={() => {
        setScheduleToDelete(null);
        setDeleteMode('single');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'horaire</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Comment souhaitez-vous supprimer cet horaire ?</p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="delete-single"
                    checked={deleteMode === 'single'}
                    onChange={() => setDeleteMode('single')}
                    className="cursor-pointer"
                  />
                  <label htmlFor="delete-single" className="cursor-pointer text-sm">
                    Uniquement cet horaire ({scheduleToDelete && new Date(scheduleToDelete.date).toLocaleDateString('fr-FR')})
                  </label>
                </div>
                
                {scheduleToDelete?.schedule_group_id && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="delete-series"
                      checked={deleteMode === 'series'}
                      onChange={() => setDeleteMode('series')}
                      className="cursor-pointer"
                    />
                    <label htmlFor="delete-series" className="cursor-pointer text-sm">
                      Toute la série d'horaires récurrents
                    </label>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchedule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
