import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Trash2, Calendar, UserPlus, ArrowUpDown } from "lucide-react";
import { CreateTaskDialog } from "@/components/taches/CreateTaskDialog";
import { TaskCard } from "@/components/taches/TaskCard";
import { SortableTaskCard } from "@/components/taches/SortableTaskCard";
import { TaskFilters, TaskFilters as TaskFiltersType } from "@/components/taches/TaskFilters";
import { ModuleHelpButton } from "@/components/communication/ModuleHelpButton";
import { toast } from "sonner";
import { isAfter, isBefore, startOfDay, format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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
  sort_order?: number;
  assigned_employee?: { nom: string; prenom: string; photo_url?: string };
  creator_employee?: { nom: string; prenom: string; photo_url?: string };
  dependency_employee?: { nom: string; prenom: string; photo_url?: string };
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
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
  const [allAssignedTasks, setAllAssignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFiltersType>({
    searchTerm: "",
    statut: [],
    priorite: [],
    dateDebut: null,
    dateFin: null,
    hideCompleted: true,
  });

  // States for bulk actions
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showChangeDateDialog, setShowChangeDateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newAssignee, setNewAssignee] = useState("");
  const [newDate, setNewDate] = useState("");

  // Sorting state for "Tâches assignées" tab
  const [assignedSortBy, setAssignedSortBy] = useState<"date" | "assignee" | "priority" | "status">("date");
  const [assignedFilterEmployee, setAssignedFilterEmployee] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      if (isAdmin || isManager) {
        fetchEmployees();
      }
    }
  }, [currentEmployeeId, isAdmin, isManager]);

  const fetchCurrentEmployee = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom, user_id")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (!error && data) {
      setCurrentEmployeeId(data.id);
    } else {
      toast.error("Vous devez être associé à un employé pour créer des tâches");
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");
    if (data) setEmployees(data);
  };

  const fetchTasks = useCallback(async () => {
    if (!currentEmployeeId) return;

    setLoading(true);
    try {
      const queries = [
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
          .order("sort_order", { ascending: true })
          .order("date_echeance", { ascending: true }),
        
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
          .order("sort_order", { ascending: true })
          .order("boomerang_deadline", { ascending: true }),
        
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
          .order("sort_order", { ascending: true })
          .order("boomerang_deadline", { ascending: true }),
        
        supabase
          .from("tasks")
          .select(`
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom, photo_url),
            creator_employee:employees!tasks_created_by_fkey(nom, prenom, photo_url),
            completed_by_employee:employees!tasks_completed_by_fkey(nom, prenom, photo_url),
            date_change_requester:employees!tasks_date_change_requested_by_fkey(nom, prenom, photo_url)
          `)
          .eq("created_by", currentEmployeeId)
          .neq("assigned_to", currentEmployeeId)
          .or("statut.eq.en_attente_validation,date_change_pending.eq.true")
          .order("updated_at", { ascending: false }),

        // All assigned tasks (for admin/manager bulk management)
        supabase
          .from("tasks")
          .select(`
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom, photo_url),
            creator_employee:employees!tasks_created_by_fkey(nom, prenom, photo_url)
          `)
          .eq("created_by", currentEmployeeId)
          .neq("assigned_to", currentEmployeeId)
          .neq("statut", "annulee")
          .order("date_echeance", { ascending: true })
      ];

      const [myTasksResult, sentBoomerangsResult, receivedBoomerangsResult, assignedPendingResult, allAssignedResult] = await Promise.all(queries);

      if (myTasksResult.error) throw myTasksResult.error;
      if (sentBoomerangsResult.error) throw sentBoomerangsResult.error;
      if (receivedBoomerangsResult.error) throw receivedBoomerangsResult.error;
      if (assignedPendingResult.error) throw assignedPendingResult.error;

      setTasks(myTasksResult.data || []);
      setBoomerangsSent(sentBoomerangsResult.data || []);
      setBoomerangsReceived(receivedBoomerangsResult.data || []);
      setAssignedPendingValidation(assignedPendingResult.data || []);
      setAllAssignedTasks(allAssignedResult.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  }, [currentEmployeeId]);

  const handleDragEnd = async (
    event: DragEndEvent,
    taskList: Task[],
    setTaskList: React.Dispatch<React.SetStateAction<Task[]>>
  ) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = taskList.findIndex((t) => t.id === active.id);
    const newIndex = taskList.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTasks = arrayMove(taskList, oldIndex, newIndex);
    setTaskList(reorderedTasks);

    try {
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("tasks")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    } catch (error) {
      console.error("Error updating task order:", error);
      toast.error("Erreur lors de la mise à jour de l'ordre");
      fetchTasks();
    }
  };

  // Bulk actions handlers
  const handleBulkReassign = async () => {
    if (!newAssignee || selectedTasks.length === 0) return;
    
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: newAssignee })
        .in("id", selectedTasks);

      if (error) throw error;

      toast.success(`${selectedTasks.length} tâche(s) réassignée(s)`);
      setSelectedTasks([]);
      setShowReassignDialog(false);
      setNewAssignee("");
      fetchTasks();
    } catch (error) {
      console.error("Error reassigning tasks:", error);
      toast.error("Erreur lors de la réassignation");
    }
  };

  const handleBulkChangeDate = async () => {
    if (!newDate || selectedTasks.length === 0) return;
    
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ date_echeance: newDate })
        .in("id", selectedTasks);

      if (error) throw error;

      toast.success(`Date modifiée pour ${selectedTasks.length} tâche(s)`);
      setSelectedTasks([]);
      setShowChangeDateDialog(false);
      setNewDate("");
      fetchTasks();
    } catch (error) {
      console.error("Error changing dates:", error);
      toast.error("Erreur lors du changement de date");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ statut: "annulee" })
        .in("id", selectedTasks);

      if (error) throw error;

      toast.success(`${selectedTasks.length} tâche(s) supprimée(s)`);
      setSelectedTasks([]);
      setShowDeleteConfirm(false);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filterTasks = (taskList: Task[]) => {
    return taskList.filter((task) => {
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchTitle = task.titre.toLowerCase().includes(term);
        const matchDesc = task.description?.toLowerCase().includes(term);
        if (!matchTitle && !matchDesc) return false;
      }

      if (filters.statut.length > 0 && !filters.statut.includes(task.statut)) return false;
      if (filters.hideCompleted && task.statut === "terminee") return false;
      if (filters.priorite.length > 0 && !filters.priorite.includes(task.priorite)) return false;

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
  const filteredAllAssigned = filterTasks(allAssignedTasks);

  // Apply additional filtering and sorting for "Tâches assignées" tab
  const getFilteredAndSortedAssigned = () => {
    let result = filteredAllAssigned;
    
    // Filter by employee
    if (assignedFilterEmployee !== "all") {
      result = result.filter(t => t.assigned_to === assignedFilterEmployee);
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      switch (assignedSortBy) {
        case "assignee":
          const nameA = `${a.assigned_employee?.prenom || ''} ${a.assigned_employee?.nom || ''}`;
          const nameB = `${b.assigned_employee?.prenom || ''} ${b.assigned_employee?.nom || ''}`;
          return nameA.localeCompare(nameB);
        case "priority":
          const priorityOrder = { haute: 0, normale: 1, basse: 2 };
          return (priorityOrder[a.priorite as keyof typeof priorityOrder] || 1) - (priorityOrder[b.priorite as keyof typeof priorityOrder] || 1);
        case "status":
          return a.statut.localeCompare(b.statut);
        case "date":
        default:
          return new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime();
      }
    });
    
    return result;
  };

  const sortedAllAssigned = getFilteredAndSortedAssigned();

  const totalTasks = tasks.length + boomerangsSent.length + boomerangsReceived.length + assignedPendingValidation.length + allAssignedTasks.length;
  const totalFiltered = filteredTasks.length + filteredBoomerangsSent.length + filteredBoomerangsReceived.length + filteredAssignedPending.length + filteredAllAssigned.length;

  const renderResetButton = (hasItems: boolean) => (
    hasItems && (
      <Button variant="outline" size="sm" onClick={() => setFilters({
        searchTerm: "",
        statut: [],
        priorite: [],
        dateDebut: null,
        dateFin: null,
        hideCompleted: false,
      })}>
        Réinitialiser les filtres
      </Button>
    )
  );

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === sortedAllAssigned.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(sortedAllAssigned.map(t => t.id));
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-xl sm:text-3xl font-bold font-display truncate">{t('title')}</h1>
            <ModuleHelpButton moduleId="tasks" />
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
          <TabsList className={`grid w-full h-auto ${(isAdmin || isManager) ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="my-tasks" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
                    <span className="hidden sm:inline">{t('tabs.myTasks')}</span>
                    <span className="sm:hidden">Tâches</span>
                    <span className="ml-1">({filteredTasks.length})</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Vos tâches personnelles qui vous sont assignées directement.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="boomerangs-sent" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
                    🪃 <span className="hidden sm:inline">{t('tabs.boomerangsSent')}</span>
                    <span className="sm:hidden">Envoyés</span>
                    <span className="ml-1">({filteredBoomerangsSent.length})</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Tâches que vous avez temporairement déléguées à un collègue et qui vous reviendront automatiquement.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="boomerangs-received" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
                    🪃 <span className="hidden sm:inline">{t('tabs.boomerangsReceived')}</span>
                    <span className="sm:hidden">Reçus</span>
                    <span className="ml-1">({filteredBoomerangsReceived.length})</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Tâches qu'un collègue vous a temporairement déléguées.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="assigned-tracking" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
                    📋 <span className="hidden sm:inline">Validations</span>
                    <span className="sm:hidden">Valid.</span>
                    {filteredAssignedPending.length > 0 && (
                      <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 text-xs">
                        {filteredAssignedPending.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p><strong>Validations en attente :</strong> Tâches que vous avez créées et assignées à d'autres, nécessitant votre validation (clôture ou changement de date).</p>
                </TooltipContent>
              </Tooltip>

              {(isAdmin || isManager) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="all-assigned" className="text-xs sm:text-sm px-1 sm:px-2 py-2">
                      📤 <span className="hidden sm:inline">Tâches déléguées</span>
                      <span className="sm:hidden">Déléguées</span>
                      <span className="ml-1">({filteredAllAssigned.length})</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p><strong>Gestion des tâches déléguées :</strong> Toutes les tâches que vous avez créées et assignées à d'autres employés. Permet de gérer en lot (réassigner, supprimer, modifier les dates).</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">{t('common:loading')}</p>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {tasks.length === 0 ? t('noTasks') : t('filters.unappliedChanges')}
                </p>
                {renderResetButton(tasks.length > 0)}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, tasks, setTasks)}
              >
                <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {filteredTasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      currentEmployeeId={currentEmployeeId}
                      onUpdate={fetchTasks}
                      highlightTerm={filters.searchTerm}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                {renderResetButton(boomerangsSent.length > 0)}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, boomerangsSent, setBoomerangsSent)}
              >
                <SortableContext items={filteredBoomerangsSent.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {filteredBoomerangsSent.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      currentEmployeeId={currentEmployeeId}
                      onUpdate={fetchTasks}
                      highlightTerm={filters.searchTerm}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                {renderResetButton(boomerangsReceived.length > 0)}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, boomerangsReceived, setBoomerangsReceived)}
              >
                <SortableContext items={filteredBoomerangsReceived.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {filteredBoomerangsReceived.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      currentEmployeeId={currentEmployeeId}
                      onUpdate={fetchTasks}
                      highlightTerm={filters.searchTerm}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                {renderResetButton(assignedPendingValidation.length > 0)}
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

          {(isAdmin || isManager) && (
            <TabsContent value="all-assigned" className="space-y-4 mt-6">
              {/* Filters and sorting */}
              <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={assignedSortBy} onValueChange={(v: any) => setAssignedSortBy(v)}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date d'échéance</SelectItem>
                      <SelectItem value="assignee">Assigné</SelectItem>
                      <SelectItem value="priority">Priorité</SelectItem>
                      <SelectItem value="status">Statut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Filtrer par employé :</Label>
                  <Select value={assignedFilterEmployee} onValueChange={setAssignedFilterEmployee}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="Tous les employés" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les employés</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.prenom} {emp.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk actions bar */}
              {selectedTasks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedTasks.length} tâche(s) sélectionnée(s)
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="outline" onClick={() => setShowReassignDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Réassigner
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowChangeDateDialog(true)}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Changer date
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-center text-muted-foreground">Chargement...</p>
              ) : sortedAllAssigned.length === 0 ? (
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    {allAssignedTasks.length === 0 
                      ? "Aucune tâche assignée à d'autres employés" 
                      : "Aucune tâche ne correspond à vos critères"}
                  </p>
                  {renderResetButton(allAssignedTasks.length > 0)}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox 
                      id="select-all"
                      checked={selectedTasks.length === sortedAllAssigned.length && sortedAllAssigned.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm cursor-pointer">
                      Tout sélectionner ({sortedAllAssigned.length})
                    </Label>
                  </div>

                  <div className="space-y-2">
                    {sortedAllAssigned.map((task) => (
                      <div key={task.id} className="flex items-start gap-2">
                        <Checkbox 
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={() => toggleTaskSelection(task.id)}
                          className="mt-4"
                        />
                        <div className="flex-1">
                          <TaskCard
                            task={task}
                            currentEmployeeId={currentEmployeeId}
                            onUpdate={fetchTasks}
                            highlightTerm={filters.searchTerm}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentEmployeeId={currentEmployeeId}
        onTaskCreated={fetchTasks}
        canAssignOthers={isAdmin || isManager}
      />

      {/* Reassign Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réassigner {selectedTasks.length} tâche(s)</DialogTitle>
            <DialogDescription>
              Sélectionnez le nouvel employé à qui assigner ces tâches.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nouvel assigné</Label>
            <Combobox
              value={newAssignee}
              onValueChange={setNewAssignee}
              options={employees.map(emp => ({
                value: emp.id,
                label: `${emp.prenom} ${emp.nom}`
              }))}
              placeholder="Sélectionner un employé"
              searchPlaceholder="Rechercher..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkReassign} disabled={!newAssignee}>
              Réassigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Date Dialog */}
      <Dialog open={showChangeDateDialog} onOpenChange={setShowChangeDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer la date de {selectedTasks.length} tâche(s)</DialogTitle>
            <DialogDescription>
              Sélectionnez la nouvelle date d'échéance.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nouvelle date d'échéance</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeDateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkChangeDate} disabled={!newDate}>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedTasks.length} tâche(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les tâches seront marquées comme annulées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Taches;
