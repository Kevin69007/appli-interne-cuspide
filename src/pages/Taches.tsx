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
      toast.error(t('errors.mustBeEmployee'));
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
        
        // Pending validations - tasks where current employee is the validation responsible
        supabase
          .from("tasks")
          .select(`
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom, photo_url),
            creator_employee:employees!tasks_created_by_fkey(nom, prenom, photo_url),
            completed_by_employee:employees!tasks_completed_by_fkey(nom, prenom, photo_url),
            date_change_requester:employees!tasks_date_change_requested_by_fkey(nom, prenom, photo_url),
            validation_responsable:employees!tasks_validation_responsable_id_fkey(nom, prenom, photo_url)
          `)
          .or(`validation_responsable_id.eq.${currentEmployeeId},and(validation_responsable_id.is.null,created_by.eq.${currentEmployeeId})`)
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
      toast.error(t('errors.loadError'));
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
      toast.error(t('errors.updateOrderError'));
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

      toast.success(t('bulk.reassignSuccess', { count: selectedTasks.length }));
      setSelectedTasks([]);
      setShowReassignDialog(false);
      setNewAssignee("");
      fetchTasks();
    } catch (error) {
      console.error("Error reassigning tasks:", error);
      toast.error(t('bulk.reassignError'));
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

      toast.success(t('bulk.changeDateSuccess', { count: selectedTasks.length }));
      setSelectedTasks([]);
      setShowChangeDateDialog(false);
      setNewDate("");
      fetchTasks();
    } catch (error) {
      console.error("Error changing dates:", error);
      toast.error(t('bulk.changeDateError'));
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

      toast.success(t('bulk.deleteSuccess', { count: selectedTasks.length }));
      setSelectedTasks([]);
      setShowDeleteConfirm(false);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error(t('bulk.deleteError'));
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
        {t('filters.resetFilters')}
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
    <div className="min-h-screen bg-background p-2 sm:p-4 pb-20 sm:pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-lg sm:text-3xl font-bold font-display truncate">{t('title')}</h1>
            <ModuleHelpButton moduleId="tasks" />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="shrink-0 h-9 sm:h-10">
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
          <TabsList scrollable className="w-full h-auto p-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="my-tasks" className="text-xs sm:text-sm px-2 sm:px-3 py-2 min-w-fit">
                    <span className="hidden sm:inline">{t('tabs.myTasks')}</span>
                    <span className="sm:hidden">{t('tabs.tasks')}</span>
                    <span className="ml-1">({filteredTasks.length})</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{t('tabs.tooltips.myTasks')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="boomerangs-sent" className="text-xs sm:text-sm px-2 sm:px-3 py-2 min-w-fit">
                    🪃 <span className="hidden sm:inline">{t('tabs.boomerangsSent')}</span>
                    <span className="sm:hidden">{t('tabs.sent')}</span>
                    <span className="ml-1">({filteredBoomerangsSent.length})</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{t('tabs.tooltips.boomerangsSent')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="boomerangs-received" className="text-xs sm:text-sm px-2 sm:px-3 py-2 min-w-fit">
                    🪃 <span className="hidden sm:inline">{t('tabs.boomerangsReceived')}</span>
                    <span className="sm:hidden">{t('tabs.received')}</span>
                    <span className="ml-1">({filteredBoomerangsReceived.length})</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{t('tabs.tooltips.boomerangsReceived')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="assigned-tracking" className="text-xs sm:text-sm px-2 sm:px-3 py-2 min-w-fit">
                    📋 <span className="hidden sm:inline">{t('tabs.assignedTracking')}</span>
                    <span className="sm:hidden">{t('tabs.valid')}</span>
                    {filteredAssignedPending.length > 0 && (
                      <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 text-xs">
                        {filteredAssignedPending.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{t('tabs.tooltips.validations')}</p>
                </TooltipContent>
              </Tooltip>

              {(isAdmin || isManager) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="all-assigned" className="text-xs sm:text-sm px-2 sm:px-3 py-2 min-w-fit">
                      📤 <span className="hidden sm:inline">{t('tabs.delegatedTasks')}</span>
                      <span className="sm:hidden">{t('tabs.delegated')}</span>
                      <span className="ml-1">({filteredAllAssigned.length})</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{t('tabs.tooltips.delegatedTasks')}</p>
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
              <p className="text-center text-muted-foreground">{t('common:loading')}</p>
            ) : filteredBoomerangsSent.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {boomerangsSent.length === 0 ? t('boomerang.noBoomerangsSent') : t('boomerang.noMatchingBoomerangs')}
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
              <p className="text-center text-muted-foreground">{t('common:loading')}</p>
            ) : filteredBoomerangsReceived.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {boomerangsReceived.length === 0 ? t('boomerang.noBoomerangsReceived') : t('boomerang.noMatchingBoomerangs')}
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
              <p className="text-center text-muted-foreground">{t('common:loading')}</p>
            ) : filteredAssignedPending.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {assignedPendingValidation.length === 0 
                    ? t('validation.noValidationPending') 
                    : t('delegated.noMatchingTasks')}
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
            <TabsContent value="all-assigned" className="space-y-4 mt-4 sm:mt-6">
              {/* Filters and sorting */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={assignedSortBy} onValueChange={(v: any) => setAssignedSortBy(v)}>
                    <SelectTrigger className="w-full sm:w-[140px] h-9">
                      <SelectValue placeholder={t('sorting.sortBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">{t('sorting.dueDate')}</SelectItem>
                      <SelectItem value="assignee">{t('sorting.assignee')}</SelectItem>
                      <SelectItem value="priority">{t('sorting.priority')}</SelectItem>
                      <SelectItem value="status">{t('sorting.status')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">{t('sorting.filter')}</Label>
                  <Select value={assignedFilterEmployee} onValueChange={setAssignedFilterEmployee}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                      <SelectValue placeholder={t('sorting.allEmployees')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('sorting.allEmployees')}</SelectItem>
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
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-center sm:text-left">
                    {t('bulk.selected', { count: selectedTasks.length })}
                  </span>
                  <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <Button size="sm" variant="outline" onClick={() => setShowReassignDialog(true)} className="flex-1 sm:flex-none h-9">
                      <UserPlus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{t('bulk.reassign')}</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowChangeDateDialog(true)} className="flex-1 sm:flex-none h-9">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{t('bulk.changeDate')}</span>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="flex-1 sm:flex-none h-9">
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{t('bulk.delete')}</span>
                    </Button>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-center text-muted-foreground">{t('common:loading')}</p>
              ) : sortedAllAssigned.length === 0 ? (
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    {allAssignedTasks.length === 0 
                      ? t('delegated.noTasks') 
                      : t('delegated.noMatchingTasks')}
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
                      {t('delegated.selectAll')} ({sortedAllAssigned.length})
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
            <DialogTitle>{t('bulk.reassignTitle', { count: selectedTasks.length })}</DialogTitle>
            <DialogDescription>
              {t('bulk.reassignDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('bulk.newAssignee')}</Label>
            <Combobox
              value={newAssignee}
              onValueChange={setNewAssignee}
              options={employees.map(emp => ({
                value: emp.id,
                label: `${emp.prenom} ${emp.nom}`
              }))}
              placeholder={t('bulk.selectEmployee')}
              searchPlaceholder={t('bulk.searchEmployee')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
              {t('bulk.cancel')}
            </Button>
            <Button onClick={handleBulkReassign} disabled={!newAssignee}>
              {t('bulk.reassign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Date Dialog */}
      <Dialog open={showChangeDateDialog} onOpenChange={setShowChangeDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bulk.changeDateTitle', { count: selectedTasks.length })}</DialogTitle>
            <DialogDescription>
              {t('bulk.changeDateDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('bulk.newDueDate')}</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeDateDialog(false)}>
              {t('bulk.cancel')}
            </Button>
            <Button onClick={handleBulkChangeDate} disabled={!newDate}>
              {t('bulk.modify')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulk.deleteTitle', { count: selectedTasks.length })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulk.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('bulk.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('bulk.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Taches;
