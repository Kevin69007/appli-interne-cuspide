import { useState, useEffect } from "react";
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
  assigned_employee?: { nom: string; prenom: string };
  creator_employee?: { nom: string; prenom: string };
  dependency_employee?: { nom: string; prenom: string };
}

const Taches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boomerangsSent, setBoomerangsSent] = useState<Task[]>([]);
  const [boomerangsReceived, setBoomerangsReceived] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFiltersType>({
    searchTerm: "",
    statut: null,
    priorite: null,
    dateDebut: null,
    dateFin: null,
    hideCompleted: false,
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

  const fetchTasks = async () => {
    if (!currentEmployeeId) {
      console.log("No currentEmployeeId, skipping task fetch");
      return;
    }

    console.log("Fetching tasks for employee ID:", currentEmployeeId);
    setLoading(true);
    try {
      // Mes tâches (assignées à moi, pas en mode boomerang actif)
      const { data: myTasks, error: myError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom)
        `)
        .eq("assigned_to", currentEmployeeId)
        .eq("boomerang_active", false)
        .neq("statut", "annulee")
        .order("date_echeance");

      if (myError) throw myError;

      // Boomerangs envoyés (je suis le propriétaire original)
      const { data: sentBoomerangs, error: sentError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom),
          boomerang_holder:employees!tasks_boomerang_current_holder_fkey(nom, prenom)
        `)
        .eq("boomerang_original_owner", currentEmployeeId)
        .eq("boomerang_active", true)
        .order("boomerang_deadline");

      if (sentError) throw sentError;

      // Boomerangs reçus (je suis le détenteur actuel)
      const { data: receivedBoomerangs, error: receivedError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom),
          boomerang_owner:employees!tasks_boomerang_original_owner_fkey(nom, prenom)
        `)
        .eq("boomerang_current_holder", currentEmployeeId)
        .eq("boomerang_active", true)
        .order("boomerang_deadline");

      if (receivedError) throw receivedError;

      setTasks(myTasks || []);
      setBoomerangsSent(sentBoomerangs || []);
      setBoomerangsReceived(receivedBoomerangs || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  };

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

  const totalTasks = tasks.length + boomerangsSent.length + boomerangsReceived.length;
  const totalFiltered = filteredTasks.length + filteredBoomerangsSent.length + filteredBoomerangsReceived.length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Mes Tâches</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-tasks">
              Mes tâches ({filteredTasks.length})
            </TabsTrigger>
            <TabsTrigger value="boomerangs-sent">
              🪃 Envoyés ({filteredBoomerangsSent.length})
            </TabsTrigger>
            <TabsTrigger value="boomerangs-received">
              🪃 Reçus ({filteredBoomerangsReceived.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {tasks.length === 0 ? "Aucune tâche pour le moment" : "Aucune tâche ne correspond à vos critères"}
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
        </Tabs>
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentEmployeeId={currentEmployeeId}
        onTaskCreated={fetchTasks}
        canAssignOthers={true}
      />
    </div>
  );
};

export default Taches;
