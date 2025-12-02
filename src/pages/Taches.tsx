import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft } from "lucide-react";
import { CreateTaskDialog } from "@/components/taches/CreateTaskDialog";
import { TaskCard } from "@/components/taches/TaskCard";
import { TaskFilters, TaskFilters as TaskFiltersType } from "@/components/taches/TaskFilters";
import { toast } from "sonner";
import { isAfter, isBefore, isEqual, startOfDay } from "date-fns";
import { useTranslation } from "react-i18next";

interface Task {
  id: string;
  titre: string;
  description: string;
  date_echeance: string;
  statut: string;
  priorite: string;
  created_by: string;
  assigned_to: string;
  depend_de: string | null;
  parent_task_id: string | null;
  recurrence: any;
  commentaires: any;
  rappels: any;
  created_at: string;
  updated_at: string;
  assigned_employee?: { nom: string; prenom: string; photo_url?: string };
  creator_employee?: { nom: string; prenom: string; photo_url?: string };
  dependency_employee?: { nom: string; prenom: string; photo_url?: string };
}

const Taches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const { t } = useTranslation('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boomerangsSent, setBoomerangsSent] = useState<Task[]>([]);
  const [boomerangsReceived, setBoomerangsReceived] = useState<Task[]>([]);
  const [assignedPendingValidation, setAssignedPendingValidation] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFiltersType>({
    searchTerm: "",
    statut: null,
    priorite: null,
    dateDebut: null,
    dateFin: null,
    hideCompleted: true,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCurrentEmployee();
  }, [user, navigate]);

  useEffect(() => {
    if (currentEmployeeId) {
      fetchTasks();
    }
  }, [currentEmployeeId]);

  const fetchCurrentEmployee = async () => {
    console.log("Fetching employee for user_id:", user?.id);
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom, user_id")
      .eq("user_id", user?.id)
      .maybeSingle();

    console.log("Employee data:", data, "Error:", error);
    if (!error && data) {
      setCurrentEmployeeId(data.id);
      console.log("Current employee ID set to:", data.id);
    } else {
      console.error("Failed to fetch employee:", error);
      toast.error("Vous devez être associé à un employé pour créer des tâches");
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!currentEmployeeId) {
      console.log("No currentEmployeeId, skipping task fetch");
      return;
    }

    console.log("Fetching tasks for employee ID:", currentEmployeeId);
    setLoading(true);
    try {
      // ✅ Exécuter les 3 requêtes EN PARALLÈLE avec Promise.all
      const [myTasksResult, sentBoomerangsResult, receivedBoomerangsResult, assignedPendingResult] = await Promise.all([
        // Mes tâches (assignées à moi, pas en mode boomerang actif)
        supabase
          .from("tasks")
          .select(`
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom, photo_url),
            creator_employee:employees!tasks_created_by_fkey(nom, prenom, photo_url)
          `)
          .eq("assigned_to", currentEmployeeId)
          .eq("boomerang_active", false)
          .neq("statut", "annulee")
          .neq("statut", "en_attente_validation")
          .order("date_echeance"),
        
        // Boomerangs envoyés (je suis le propriétaire original)
        supabase
          .from("tasks")
          .select(`
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom, photo_url),
            creator_employee:employees!tasks_created_by_fkey(nom, prenom, photo_url),
            boomerang_holder:employees!tasks_boomerang_current_holder_fkey(nom, prenom, photo_url)
          `)
          .eq("boomerang_original_owner", currentEmployeeId)
          .eq("boomerang_active", true)
          .order("boomerang_deadline"),
        
        // Boomerangs reçus (je suis le détenteur actuel)
        supabase
          .from("tasks")
          .select(`
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom, photo_url),
            creator_employee:employees!tasks_created_by_fkey(nom, prenom, photo_url),
            boomerang_owner:employees!tasks_boomerang_original_owner_fkey(nom, prenom, photo_url)
          `)
          .eq("boomerang_current_holder", currentEmployeeId)
          .eq("boomerang_active", true)
          .order("boomerang_deadline"),
        
        // Tâches affectées en attente de validation (je suis le créateur, quelqu'un d'autre les a marquées terminées)
        supabase
          .from("tasks")
          .select(`
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom, photo_url),
            creator_employee:employees!tasks_created_by_fkey(nom, prenom, photo_url),
            completed_by_employee:employees!tasks_completed_by_fkey(nom, prenom, photo_url)
          `)
          .eq("created_by", currentEmployeeId)
          .neq("assigned_to", currentEmployeeId)
          .eq("statut", "en_attente_validation")
          .order("completed_at", { ascending: false })
      ]);

      if (myTasksResult.error) throw myTasksResult.error;
      if (sentBoomerangsResult.error) throw sentBoomerangsResult.error;
      if (receivedBoomerangsResult.error) throw receivedBoomerangsResult.error;
      if (assignedPendingResult.error) throw assignedPendingResult.error;

      setTasks(myTasksResult.data || []);
      setBoomerangsSent(sentBoomerangsResult.data || []);
      setBoomerangsReceived(receivedBoomerangsResult.data || []);
      setAssignedPendingValidation(assignedPendingResult.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  }, [currentEmployeeId]);

  // Filter tasks based on active filters
  const filterTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      // Search term filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchTitle = task.titre.toLowerCase().includes(term);
        const matchDesc = task.description?.toLowerCase().includes(term);
        if (!matchTitle && !matchDesc) return false;
      }

      // Status filter
      if (filters.statut && task.statut !== filters.statut) return false;

      // Hide completed filter
      if (filters.hideCompleted && task.statut === "terminee") return false;

      // Priority filter
      if (filters.priorite && task.priorite !== filters.priorite) return false;

      // Date range filter
      if (filters.dateDebut || filters.dateFin) {
        const taskDate = startOfDay(new Date(task.date_echeance));
        
        if (filters.dateDebut) {
          const startDate = startOfDay(filters.dateDebut);
          if (isBefore(taskDate, startDate)) return false;
        }
        
        if (filters.dateFin) {
          const endDate = startOfDay(filters.dateFin);
          if (isAfter(taskDate, endDate)) return false;
        }
      }

      return true;
    });
  };

  const filteredTasks = filterTasks(tasks);
  const filteredBoomerangsSent = filterTasks(boomerangsSent);
  const filteredBoomerangsReceived = filterTasks(boomerangsReceived);
  const filteredAssignedPending = filterTasks(assignedPendingValidation);

  const totalTasks = tasks.length + boomerangsSent.length + boomerangsReceived.length + assignedPendingValidation.length;
  const totalFiltered = filteredTasks.length + filteredBoomerangsSent.length + filteredBoomerangsReceived.length + filteredAssignedPending.length;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-xl sm:text-3xl font-bold font-display truncate">{t('title')}</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('createTask')}</span>
          </Button>
        </div>

        <TaskFilters
          onFilterChange={setFilters}
          taskCount={{
            total: totalTasks,
            filtered: totalFiltered,
          }}
        />

        <Tabs defaultValue="my-tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="my-tasks" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
              <span className="hidden sm:inline">{t('tabs.myTasks')}</span>
              <span className="sm:hidden">Tâches</span>
              <span className="ml-1">({filteredTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="boomerangs-sent" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
              🪃 <span className="hidden sm:inline">{t('tabs.boomerangsSent')}</span>
              <span className="sm:hidden">Envoyés</span>
              <span className="ml-1">({filteredBoomerangsSent.length})</span>
            </TabsTrigger>
            <TabsTrigger value="boomerangs-received" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
              🪃 <span className="hidden sm:inline">{t('tabs.boomerangsReceived')}</span>
              <span className="sm:hidden">Reçus</span>
              <span className="ml-1">({filteredBoomerangsReceived.length})</span>
            </TabsTrigger>
            <TabsTrigger value="assigned-tracking" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
              📋 <span className="hidden sm:inline">{t('tabs.assignedTracking')}</span>
              <span className="sm:hidden">Suivi</span>
              {filteredAssignedPending.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 text-xs">
                  {filteredAssignedPending.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">{t('common:loading')}</p>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {tasks.length === 0 ? t('noTasks') : t('filters.unappliedChanges')}
                </p>
                {tasks.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                    searchTerm: "",
                    statut: null,
                    priorite: null,
                    dateDebut: null,
                    dateFin: null,
                    hideCompleted: false,
                  })}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
                  highlightTerm={filters.searchTerm}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="boomerangs-sent" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : filteredBoomerangsSent.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {boomerangsSent.length === 0 ? "Aucun boomerang envoyé" : "Aucun boomerang ne correspond à vos critères"}
                </p>
                {boomerangsSent.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                    searchTerm: "",
                    statut: null,
                    priorite: null,
                    dateDebut: null,
                    dateFin: null,
                    hideCompleted: false,
                  })}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              filteredBoomerangsSent.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
                  highlightTerm={filters.searchTerm}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="boomerangs-received" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : filteredBoomerangsReceived.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {boomerangsReceived.length === 0 ? "Aucun boomerang reçu" : "Aucun boomerang ne correspond à vos critères"}
                </p>
                {boomerangsReceived.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                    searchTerm: "",
                    statut: null,
                    priorite: null,
                    dateDebut: null,
                    dateFin: null,
                    hideCompleted: false,
                  })}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              filteredBoomerangsReceived.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
                  highlightTerm={filters.searchTerm}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned-tracking" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : filteredAssignedPending.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {assignedPendingValidation.length === 0 
                    ? "Aucune tâche en attente de validation" 
                    : "Aucune tâche ne correspond à vos critères"}
                </p>
                {assignedPendingValidation.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                    searchTerm: "",
                    statut: null,
                    priorite: null,
                    dateDebut: null,
                    dateFin: null,
                    hideCompleted: false,
                  })}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              filteredAssignedPending.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
                  highlightTerm={filters.searchTerm}
                  isValidationPending
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentEmployeeId={currentEmployeeId}
        onTaskCreated={fetchTasks}
        canAssignOthers={isAdmin || isManager}
      />
    </div>
  );
};

export default Taches;
