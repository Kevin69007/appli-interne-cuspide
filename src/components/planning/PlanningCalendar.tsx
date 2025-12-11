import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CreateScheduleDialog } from "./CreateScheduleDialog";
import { EditScheduleDialog } from "./EditScheduleDialog";
import { AddEventDialog } from "@/components/objectifs-primes/AddEventDialog";
import { CreateTaskDialog } from "@/components/taches/CreateTaskDialog";
import { EmployeeScheduleDetailsDialog } from "./EmployeeScheduleDetailsDialog";
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
import { useTranslation } from "react-i18next";

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

interface ConsolidatedSchedule extends WorkSchedule {
  originalSchedules: WorkSchedule[];
}

interface Absence {
  id: string;
  employee_id: string;
  date: string;
  detail: string | null;
  type_absence: string | null;
  statut_validation: string | null;
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
  const { t } = useTranslation('planning');
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [teams, setTeams] = useState<string[]>([]);
  const [scheduleToDelete, setScheduleToDelete] = useState<WorkSchedule | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'series'>('single');
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  // Employee details dialog state
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [selectedEmployeeDate, setSelectedEmployeeDate] = useState<Date | null>(null);
  // Edit schedule dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<WorkSchedule | null>(null);

  useEffect(() => {
    fetchSchedules();
    fetchAbsences();
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

  const fetchAbsences = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let query = supabase
      .from("agenda_entries")
      .select(`
        id,
        employee_id,
        date,
        detail,
        type_absence,
        statut_validation,
        employees!inner(nom, prenom, equipe)
      `)
      .eq("categorie", "absence")
      .neq("statut_validation", "refuse")
      .gte("date", startOfMonth.toISOString().split("T")[0])
      .lte("date", endOfMonth.toISOString().split("T")[0]);

    if (selectedTeam !== "all") {
      query = query.eq("employees.equipe", selectedTeam);
    }

    const { data, error } = await query;

    if (!error && data) {
      setAbsences(data as any);
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

  // Consolidate schedules by employee: one line per employee with earliest start and latest end
  const consolidateSchedulesByEmployee = (daySchedules: WorkSchedule[]): ConsolidatedSchedule[] => {
    const byEmployee = new Map<string, WorkSchedule[]>();
    
    daySchedules.forEach((s) => {
      const existing = byEmployee.get(s.employee_id) || [];
      byEmployee.set(s.employee_id, [...existing, s]);
    });
    
    return Array.from(byEmployee.entries()).map(([employeeId, empSchedules]) => {
      // Sort by start time
      const sorted = empSchedules.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
      const earliest = sorted[0];
      const latest = sorted.reduce((acc, s) => 
        s.heure_fin > acc.heure_fin ? s : acc, sorted[0]
      );
      
      return {
        ...earliest,
        heure_debut: earliest.heure_debut,
        heure_fin: latest.heure_fin,
        originalSchedules: sorted,
      };
    });
  };

  const getSchedulesForDate = (date: Date | null): ConsolidatedSchedule[] => {
    if (!date) return [];
    // Utiliser le format YYYY-MM-DD sans conversion UTC pour éviter les décalages
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const daySchedules = schedules.filter((s) => s.date === dateStr);
    return consolidateSchedulesByEmployee(daySchedules);
  };

  const getAbsencesForDate = (date: Date | null) => {
    if (!date) return [];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return absences.filter((a) => a.date === dateStr);
  };

  const handleEmployeeClick = (
    employeeId: string,
    employeeName: string,
    date: Date,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!canManage) return;
    setSelectedEmployeeId(employeeId);
    setSelectedEmployeeName(employeeName);
    setSelectedEmployeeDate(date);
    setShowEmployeeDetails(true);
  };

  const handleDayClick = (date: Date) => {
    if (canManage) {
      setSelectedDate(date);
      setShowChoiceDialog(true);
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
      if (!scheduleToDelete.schedule_group_id) {
        toast.error(t('noSeriesFound'));
        return;
      }
      query = query.eq("schedule_group_id", scheduleToDelete.schedule_group_id);
    }

    const { error } = await query;

    if (error) {
      toast.error(t('deleteError'));
      console.error(error);
    } else {
      toast.success(deleteMode === 'single' ? t('scheduleDeleted') : t('seriesDeleted'));
      fetchSchedules();
    }
    setScheduleToDelete(null);
    setDeleteMode('single');
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base sm:text-xl font-semibold capitalize min-w-[140px] sm:min-w-[200px] text-center">
              {monthName}
            </h2>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full sm:w-[200px] h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTeams')}</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons - Responsive */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10 flex-1 sm:flex-none" onClick={() => navigate('/conges-mood-bar')}>
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {t('requestLeave')}
          </Button>
          {canManage && (
            <>
              <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-10 flex-1 sm:flex-none" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Planning
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10 hidden md:flex" onClick={() => {
                setSelectedDate(new Date());
                setShowEventDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('event')}
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10 hidden md:flex" onClick={() => setShowMaintenanceDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('newMaintenanceTask')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Calendar Grid - Responsive */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible">
        <div className="min-w-[500px] sm:min-w-0">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="text-center font-semibold text-[10px] sm:text-sm py-1 sm:py-2">
                {day}
              </div>
            ))}

            {days.map((date, index) => {
              const daySchedules = getSchedulesForDate(date);
              const dayAbsences = getAbsencesForDate(date);
              const isToday = date?.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  onClick={() => date && handleDayClick(date)}
                  className={`min-h-[80px] sm:min-h-[120px] border rounded sm:rounded-lg p-1 sm:p-2 ${
                    date
                      ? canManage
                        ? "cursor-pointer hover:bg-accent/50"
                        : "cursor-default"
                      : "bg-muted/30"
                  } ${isToday ? "ring-2 ring-primary" : ""}`}
                  title={canManage && date ? t('clickToAddPlanning') : ""}
                >
                  {date && (
                    <>
                      <div className="text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1">{date.getDate()}</div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {/* Horaires de travail - consolidated by employee */}
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="text-[9px] sm:text-xs bg-cyan-500/10 border-l-2 border-cyan-500 rounded px-0.5 sm:px-1 py-0.5 group relative cursor-pointer hover:bg-cyan-500/20"
                            title={`${schedule.employees.prenom}: ${schedule.heure_debut.slice(0, 5)} - ${schedule.heure_fin.slice(0, 5)}${schedule.originalSchedules.length > 1 ? ` (${schedule.originalSchedules.length} slots)` : ''}${canManage ? ` - ${t('clickEmployeeDetails')}` : ''}`}
                            onClick={(e) => date && handleEmployeeClick(
                              schedule.employee_id,
                              `${schedule.employees.prenom} ${schedule.employees.nom}`,
                              date,
                              e
                            )}
                          >
                            <div className="flex items-center justify-between gap-0.5 sm:gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {schedule.employees.prenom}
                                </div>
                                <div className="text-muted-foreground hidden sm:block">
                                  {schedule.heure_debut.slice(0, 5)} - {schedule.heure_fin.slice(0, 5)}
                                </div>
                              </div>
                              {canManage && (
                                <div className="hidden sm:flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScheduleToEdit(schedule.originalSchedules[0]);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3 text-primary" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScheduleToDelete(schedule.originalSchedules[0]);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Absences */}
                        {dayAbsences.map((absence) => {
                          const isPending = absence.statut_validation !== 'valide';
                          const canClickToValidate = canManage && isPending;
                          
                          return (
                            <div
                              key={absence.id}
                              className={`text-[9px] sm:text-xs rounded px-0.5 sm:px-1 py-0.5 ${
                                absence.statut_validation === 'valide'
                                  ? 'bg-purple-500/10 border-l-2 border-purple-500'
                                  : 'bg-yellow-500/10 border-l-2 border-yellow-500'
                              } ${canClickToValidate ? 'cursor-pointer hover:bg-yellow-500/20 transition-colors' : ''}`}
                              title={canClickToValidate 
                                ? `${absence.employees.prenom} ${absence.employees.nom}: ${absence.type_absence || absence.detail || t('absence')} - ${t('clickToValidate')}`
                                : `${absence.employees.prenom} ${absence.employees.nom}: ${absence.type_absence || absence.detail || t('absence')}`
                              }
                              onClick={(e) => {
                                if (canClickToValidate) {
                                  e.stopPropagation();
                                  navigate('/conges-mood-bar');
                                }
                              }}
                            >
                              <span className="truncate block">
                                {absence.employees.prenom}
                                <span className="hidden sm:inline"> - {absence.type_absence || t('absence')}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-500/10 border-l-2 border-cyan-500" />
          <span>{t('workSchedules')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500/10 border-l-2 border-purple-500" />
          <span>{t('validatedAbsence')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500/10 border-l-2 border-yellow-500" />
          <span>{t('pendingAbsence')}</span>
        </div>
        {canManage && (
          <div className="text-muted-foreground italic">
            {t('clickEmployeeDetails')}
          </div>
        )}
      </div>

      {canManage && (
        <>
          <CreateScheduleDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onScheduleCreated={() => { fetchSchedules(); fetchAbsences(); }}
          />
          {selectedDate && (
            <AddEventDialog
              open={showEventDialog}
              onOpenChange={setShowEventDialog}
              selectedDate={selectedDate}
              onEventAdded={() => { fetchSchedules(); fetchAbsences(); }}
            />
          )}
          <CreateTaskDialog
            open={showMaintenanceDialog}
            onOpenChange={setShowMaintenanceDialog}
            currentEmployeeId={currentEmployeeId}
            onTaskCreated={() => { fetchSchedules(); fetchAbsences(); }}
            canAssignOthers={true}
            isMaintenance={true}
          />

          <AlertDialog open={showChoiceDialog} onOpenChange={setShowChoiceDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('whatToAdd')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('chooseTypeForDate')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 my-4">
                <Button
                  onClick={() => {
                    setShowChoiceDialog(false);
                    setShowCreateDialog(true);
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addPlanning')}
                </Button>
                <Button
                  onClick={() => {
                    setShowChoiceDialog(false);
                    setShowEventDialog(true);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addEvent')}
                </Button>
                <Button
                  onClick={() => {
                    setShowChoiceDialog(false);
                    setShowMaintenanceDialog(true);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newMaintenanceTask')}
                </Button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <AlertDialog open={!!scheduleToDelete} onOpenChange={() => {
        setScheduleToDelete(null);
        setDeleteMode('single');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteScheduleTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{t('howDeleteSchedule')}</p>
              
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
                    {t('onlyThisSchedule')} ({scheduleToDelete && new Date(scheduleToDelete.date).toLocaleDateString()})
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
                      {t('entireRecurringSeries')}
                    </label>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchedule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteSchedule')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee Details Dialog */}
      {selectedEmployeeId && selectedEmployeeDate && (
        <EmployeeScheduleDetailsDialog
          open={showEmployeeDetails}
          onOpenChange={setShowEmployeeDetails}
          employeeId={selectedEmployeeId}
          employeeName={selectedEmployeeName}
          date={selectedEmployeeDate}
          onSchedulesUpdated={() => { fetchSchedules(); fetchAbsences(); }}
        />
      )}

      {/* Edit Schedule Dialog */}
      <EditScheduleDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        schedule={scheduleToEdit}
        onScheduleUpdated={() => { fetchSchedules(); fetchAbsences(); }}
      />
    </div>
  );
};
