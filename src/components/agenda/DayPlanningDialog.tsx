import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { GripVertical, Clock, Calendar, Plus, Minus, X } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DayPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onUpdate: () => void;
}

interface Task {
  id: string;
  titre: string;
  priorite: string;
  statut: string;
  date_echeance: string;
}

interface TaskPlanning {
  id: string;
  task_id: string;
  start_hour: number;
  duration_slots: number;
  order_index: number;
}

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => 7 + i * 0.5); // 7:00 to 20:00 in 30 min increments

const getPriorityColor = (priorite: string) => {
  switch (priorite) {
    case "haute": return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
    case "moyenne": return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    default: return "border-l-green-500 bg-green-50 dark:bg-green-950/20";
  }
};

// Sortable task for the left column - can be reordered AND dropped on time slots
const SortableTask = ({ task }: { task: Task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task, type: "sortable" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-2 rounded border-l-4 cursor-grab active:cursor-grabbing
        ${getPriorityColor(task.priorite)}
        ${isDragging ? "opacity-50 shadow-lg z-50" : ""}
        transition-shadow hover:shadow-md
      `}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate font-medium text-sm">{task.titre}</span>
      </div>
    </div>
  );
};

// Draggable placed task - can be dragged back to task list
const DraggablePlacedTask = ({ 
  placement, 
  onRemove, 
  onResize,
  formatDuration,
}: { 
  placement: TaskPlanning & { task?: Task };
  onRemove: (id: string) => void;
  onResize: (id: string, newDuration: number) => void;
  formatDuration: (slots: number) => string;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${placement.id}`,
    data: { placement, task: placement.task, type: "placed" },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  if (!placement.task) return null;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`
        h-full bg-primary/10 rounded border border-primary/30
        ${isDragging ? "opacity-50 shadow-lg z-50" : ""}
      `}
    >
      <div className="p-2 h-full flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <div 
            {...listeners} 
            {...attributes}
            className="flex items-center gap-1 flex-1 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium truncate">
              {placement.task.titre}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={() => onRemove(placement.id)}
            title="Retirer du planning"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Duration controls */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDuration(placement.duration_slots)}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-5 w-5"
              onClick={() => onResize(placement.id, placement.duration_slots - 1)}
              disabled={placement.duration_slots <= 1}
              title="Réduire la durée"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-5 w-5"
              onClick={() => onResize(placement.id, placement.duration_slots + 1)}
              disabled={placement.duration_slots >= 8}
              title="Augmenter la durée"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Combined droppable + sortable zone for the task list
const TaskListDropZone = ({ 
  tasks,
  loading,
}: { 
  tasks: Task[];
  loading: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "task-list",
    data: { type: "task-list" },
  });

  return (
    <ScrollArea className="flex-1">
      <div 
        ref={setNodeRef} 
        className={`
          min-h-full rounded-lg transition-colors p-1
          ${isOver ? "bg-primary/10 ring-2 ring-primary/30" : ""}
        `}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pr-2">
            {loading ? (
              <p className="text-sm text-muted-foreground p-2">Chargement...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">
                {isOver ? "Déposer ici pour retirer du planning" : "Toutes les tâches sont planifiées"}
              </p>
            ) : (
              tasks.map(task => (
                <SortableTask key={task.id} task={task} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </ScrollArea>
  );
};

const DroppableTimeSlot = ({
  hour,
  children,
  isOccupied,
}: {
  hour: number;
  children?: React.ReactNode;
  isOccupied?: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${hour}`,
    data: { hour },
    disabled: isOccupied,
  });

  const formatHour = (h: number) => {
    const hours = Math.floor(h);
    const minutes = (h % 1) * 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-stretch min-h-[40px] border-b border-border/50
        ${isOver && !isOccupied ? "bg-primary/10" : ""}
        ${hour % 1 === 0 ? "border-t border-border" : ""}
      `}
    >
      <div className="w-16 text-xs text-muted-foreground flex items-center justify-center shrink-0 border-r border-border/50">
        {hour % 1 === 0 ? formatHour(hour) : ""}
      </div>
      <div className="flex-1 px-2 py-1">
        {children}
      </div>
    </div>
  );
};

export const DayPlanningDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onUpdate,
}: DayPlanningDialogProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plannings, setPlannings] = useState<(TaskPlanning & { task?: Task })[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchData();
    }
  }, [open, user, selectedDate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Get employee ID
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!emp) {
      setLoading(false);
      return;
    }
    setEmployeeId(emp.id);

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Fetch tasks for this day
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("id, titre, priorite, statut, date_echeance")
      .eq("assigned_to", emp.id)
      .eq("date_echeance", dateStr)
      .neq("statut", "terminee")
      .neq("statut", "annulee");

    // Fetch existing plannings
    const { data: planningsData } = await supabase
      .from("daily_task_planning")
      .select("*")
      .eq("employee_id", emp.id)
      .eq("planning_date", dateStr)
      .order("order_index");

    const tasksMap = new Map((tasksData || []).map(t => [t.id, t]));
    const enrichedPlannings = (planningsData || []).map(p => ({
      ...p,
      task: tasksMap.get(p.task_id),
    }));

    // Tasks not yet placed
    const placedTaskIds = new Set((planningsData || []).map(p => p.task_id));
    const unplacedTasks = (tasksData || []).filter(t => !placedTaskIds.has(t.id));

    setTasks(unplacedTasks);
    setPlannings(enrichedPlannings);
    setLoading(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over || !employeeId) return;

    const activeData = active.data.current;
    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle placed task dropped back to task list
    if (activeData?.type === "placed" && overId === "task-list") {
      const placementId = activeData.placement.id;
      try {
        const { error } = await supabase
          .from("daily_task_planning")
          .delete()
          .eq("id", placementId);

        if (error) throw error;
        toast.success("Tâche retirée du planning");
        fetchData();
      } catch (error) {
        console.error("Error removing planning:", error);
        toast.error("Erreur lors de la suppression");
      }
      return;
    }

    // Handle sortable reordering in left column
    if (activeData?.type === "sortable" && !overId.startsWith("slot-") && overId !== "task-list") {
      const oldIndex = tasks.findIndex(t => t.id === activeId);
      const newIndex = tasks.findIndex(t => t.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newTasks = arrayMove(tasks, oldIndex, newIndex);
        setTasks(newTasks);
        toast.success("Ordre des tâches modifié");
      }
      return;
    }

    // Handle drop on time slot (from task list OR from sortable)
    if (!overId.startsWith("slot-")) return;

    const taskId = activeData?.task?.id;
    const task = tasks.find(t => t.id === taskId) || plannings.find(p => p.task_id === taskId)?.task;
    
    if (!task) return;

    const hour = parseFloat(overId.replace("slot-", ""));
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      const { error } = await supabase
        .from("daily_task_planning")
        .upsert({
          employee_id: employeeId,
          task_id: taskId,
          planning_date: dateStr,
          start_hour: hour,
          duration_slots: 2,
          order_index: plannings.length,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "employee_id,task_id,planning_date"
        });

      if (error) throw error;
      
      toast.success("Tâche planifiée");
      fetchData();
    } catch (error) {
      console.error("Error saving planning:", error);
      toast.error("Erreur lors de la planification");
    }
  };

  const handleRemovePlanning = async (planningId: string) => {
    try {
      const { error } = await supabase
        .from("daily_task_planning")
        .delete()
        .eq("id", planningId);

      if (error) throw error;
      
      toast.success("Tâche retirée du planning");
      fetchData();
    } catch (error) {
      console.error("Error removing planning:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleResizePlanning = async (planningId: string, newDuration: number) => {
    if (newDuration < 1 || newDuration > 8) return; // Min 30min, max 4h

    try {
      const { error } = await supabase
        .from("daily_task_planning")
        .update({
          duration_slots: newDuration,
          updated_at: new Date().toISOString(),
        })
        .eq("id", planningId);

      if (error) throw error;
      
      // Update locally for instant feedback
      setPlannings(prev => prev.map(p => 
        p.id === planningId ? { ...p, duration_slots: newDuration } : p
      ));
    } catch (error) {
      console.error("Error resizing planning:", error);
      toast.error("Erreur lors du redimensionnement");
    }
  };

  const getPlacementForSlot = (hour: number) => {
    return plannings.find(p => {
      const endHour = p.start_hour + (p.duration_slots * 0.5);
      return hour >= p.start_hour && hour < endHour;
    });
  };

  const isSlotStart = (hour: number, placement?: TaskPlanning) => {
    return placement && placement.start_hour === hour;
  };

  const formatDuration = (slots: number) => {
    const minutes = slots * 30;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          </DialogTitle>
        </DialogHeader>

        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 grid grid-cols-3 gap-4 p-6 overflow-hidden">
            {/* Sortable Tasks list with droppable zone */}
            <div className="col-span-1 flex flex-col">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tâches du jour ({tasks.length})
              </h4>
              <TaskListDropZone tasks={tasks} loading={loading} />
            </div>

            {/* Time slots */}
            <div className="col-span-2 flex flex-col">
              <h4 className="text-sm font-medium mb-3">Planning horaire (glisser vers la gauche pour retirer)</h4>
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="min-w-[300px] relative">
                  {/* Background time slots (droppable areas) */}
                  {TIME_SLOTS.map(hour => {
                    const placement = getPlacementForSlot(hour);
                    const isOccupiedButNotStart = !!placement && !isSlotStart(hour, placement);
                    
                    return (
                      <DroppableTimeSlot 
                        key={hour} 
                        hour={hour} 
                        isOccupied={!!placement}
                      >
                        {/* Empty - tasks rendered with absolute positioning below */}
                      </DroppableTimeSlot>
                    );
                  })}
                  
                  {/* Placed tasks with absolute positioning to span multiple slots */}
                  {plannings.map(placement => {
                    if (!placement.task) return null;
                    const topOffset = (placement.start_hour - 7) * 2 * 40; // 40px per slot, 2 slots per hour
                    const height = placement.duration_slots * 40 - 4; // -4 for some padding
                    
                    return (
                      <div
                        key={placement.id}
                        className="absolute left-16 right-2"
                        style={{
                          top: `${topOffset}px`,
                          height: `${height}px`,
                          zIndex: 10,
                        }}
                      >
                        <DraggablePlacedTask
                          placement={placement}
                          onRemove={handleRemovePlanning}
                          onResize={handleResizePlanning}
                          formatDuration={formatDuration}
                        />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="p-2 rounded border-l-4 border-l-primary bg-background shadow-lg text-sm">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate font-medium">{activeTask.titre}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <div className="px-6 py-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            💡 Réordonnez les tâches à gauche. Glissez-les sur les créneaux horaires pour les planifier. Utilisez +/- pour ajuster la durée.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
