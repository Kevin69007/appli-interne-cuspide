import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { GripVertical, Clock, Calendar } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";

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

const DraggableTask = ({ task, isPlaced }: { task: Task; isPlaced?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case "haute": return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
      case "moyenne": return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      default: return "border-l-green-500 bg-green-50 dark:bg-green-950/20";
    }
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
        ${isDragging ? "opacity-50 shadow-lg" : ""}
        ${isPlaced ? "text-xs" : "text-sm"}
        transition-shadow hover:shadow-md
      `}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate font-medium">{task.titre}</span>
      </div>
    </div>
  );
};

const DroppableTimeSlot = ({
  hour,
  placement,
  children,
}: {
  hour: number;
  placement?: TaskPlanning & { task?: Task };
  children?: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${hour}`,
    data: { hour },
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
        ${isOver ? "bg-primary/10" : ""}
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
      .order("start_hour");

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

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId) || plannings.find(p => p.task_id === taskId)?.task;
    
    if (!task) return;

    const slotId = over.id as string;
    if (!slotId.startsWith("slot-")) return;

    const hour = parseFloat(slotId.replace("slot-", ""));
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
          order_index: 0,
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

  const getPlacementForSlot = (hour: number) => {
    return plannings.find(p => {
      const endHour = p.start_hour + (p.duration_slots * 0.5);
      return hour >= p.start_hour && hour < endHour;
    });
  };

  const isSlotStart = (hour: number, placement?: TaskPlanning) => {
    return placement && placement.start_hour === hour;
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
            {/* Tasks list */}
            <div className="col-span-1 flex flex-col">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tâches du jour ({tasks.length})
              </h4>
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Toutes les tâches sont planifiées
                    </p>
                  ) : (
                    tasks.map(task => (
                      <DraggableTask key={task.id} task={task} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Time slots */}
            <div className="col-span-2 flex flex-col">
              <h4 className="text-sm font-medium mb-3">Planning horaire</h4>
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="min-w-[300px]">
                  {TIME_SLOTS.map(hour => {
                    const placement = getPlacementForSlot(hour);
                    const showTask = isSlotStart(hour, placement);
                    
                    return (
                      <DroppableTimeSlot key={hour} hour={hour} placement={placement}>
                        {showTask && placement?.task && (
                          <div 
                            className="relative"
                            style={{ height: `${(placement.duration_slots - 1) * 40 + 32}px` }}
                          >
                            <div
                              className="absolute inset-0 p-1 cursor-pointer hover:opacity-80"
                              onClick={() => handleRemovePlanning(placement.id)}
                              title="Cliquer pour retirer"
                            >
                              <DraggableTask task={placement.task} isPlaced />
                            </div>
                          </div>
                        )}
                      </DroppableTimeSlot>
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
            💡 Glissez-déposez les tâches sur les créneaux horaires. Cliquez sur une tâche planifiée pour la retirer.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};