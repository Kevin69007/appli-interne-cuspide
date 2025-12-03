import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, GripVertical, Flag } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";

interface TaskEvent {
  id: string;
  titre: string;
  date_echeance: string;
  priorite: string;
  statut: string;
  is_priority: boolean;
  created_by: string;
  sort_order: number | null;
}

interface SortableTaskCardProps {
  task: TaskEvent;
}

const SortableTaskCard = ({ task }: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case "haute": return "destructive";
      case "moyenne": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "terminee": return "bg-green-500/20 text-green-700";
      case "en_cours": return "bg-blue-500/20 text-blue-700";
      case "en_attente_validation": return "bg-yellow-500/20 text-yellow-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 rounded-lg border bg-card shadow-sm cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50 shadow-lg ring-2 ring-primary z-50" : "hover:shadow-md hover:border-primary/50"}
        transition-all
      `}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {task.is_priority && <Flag className="h-3 w-3 text-destructive shrink-0" />}
            <span className="font-medium text-sm truncate">{task.titre}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getPriorityColor(task.priorite)} className="text-[10px] px-1.5 py-0">
              {task.priorite}
            </Badge>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(task.statut)}`}>
              {task.statut === "en_attente_validation" ? "En validation" : task.statut.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DroppableWeekDayProps {
  date: Date;
  isToday: boolean;
  tasks: TaskEvent[];
}

const DroppableWeekDay = ({ date, isToday, tasks }: DroppableWeekDayProps) => {
  const dateStr = format(date, "yyyy-MM-dd");

  return (
    <div
      data-droppable-date={dateStr}
      className={`
        flex flex-col min-h-[300px] border rounded-lg overflow-hidden
        ${isToday ? "border-primary bg-primary/5" : "border-border"}
        transition-colors
      `}
    >
      <div className={`p-3 border-b ${isToday ? "bg-primary/10" : "bg-muted/30"}`}>
        <div className="text-sm font-medium capitalize">
          {format(date, "EEEE", { locale: fr })}
        </div>
        <div className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
          {format(date, "d MMMM", { locale: fr })}
        </div>
      </div>
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm min-h-[100px]">
              Aucune tâche
            </div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

interface WeekCalendarProps {
  onDateClick?: (date: Date) => void;
}

export const WeekCalendar = ({ onDateClick }: WeekCalendarProps) => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [tasks, setTasks] = useState<TaskEvent[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [activeTask, setActiveTask] = useState<TaskEvent | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const today = new Date();

  useEffect(() => {
    fetchEmployeeInfo();
  }, [user]);

  useEffect(() => {
    if (currentEmployeeId) {
      fetchTasks();
    }
  }, [currentWeekStart, currentEmployeeId]);

  const fetchEmployeeInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setCurrentEmployeeId(data.id);
      setCurrentEmployeeName(`${data.prenom} ${data.nom}`);
    }
  };

  const fetchTasks = async () => {
    if (!currentEmployeeId) return;

    const weekEnd = addDays(currentWeekStart, 6);
    const startStr = format(currentWeekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("tasks")
      .select("id, titre, date_echeance, priorite, statut, is_priority, created_by, sort_order")
      .eq("assigned_to", currentEmployeeId)
      .gte("date_echeance", startStr)
      .lte("date_echeance", endStr)
      .neq("statut", "annulee")
      .neq("statut", "terminee")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("date_echeance", { ascending: true });

    if (!error && data) {
      setTasks(data);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as TaskEvent;
    setActiveTask(task);
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return tasks
      .filter(t => t.date_echeance === dateStr)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over || !currentEmployeeId) return;

    const draggedTask = active.data.current?.task as TaskEvent;
    if (!draggedTask) return;

    const overId = over.id as string;
    
    // Check if dropped on another task (reordering within same day)
    const overTask = over.data.current?.task as TaskEvent | undefined;
    
    if (overTask) {
      // Reordering within the same day
      if (draggedTask.date_echeance === overTask.date_echeance && draggedTask.id !== overTask.id) {
        const dayTasks = getTasksForDate(new Date(draggedTask.date_echeance));
        const oldIndex = dayTasks.findIndex(t => t.id === draggedTask.id);
        const newIndex = dayTasks.findIndex(t => t.id === overTask.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(dayTasks, oldIndex, newIndex);
          
          // Optimistic update
          setTasks(prev => {
            const otherTasks = prev.filter(t => t.date_echeance !== draggedTask.date_echeance);
            return [...otherTasks, ...reordered.map((t, i) => ({ ...t, sort_order: i }))];
          });

          // Persist to database
          try {
            for (let i = 0; i < reordered.length; i++) {
              await supabase
                .from("tasks")
                .update({ sort_order: i })
                .eq("id", reordered[i].id);
            }
          } catch (error) {
            console.error("Error reordering:", error);
            toast.error("Erreur lors du réordonnancement");
            fetchTasks();
          }
        }
        return;
      }
    }

    // Moving to a different day - find the droppable day container
    const droppableElement = document.querySelector(`[data-droppable-date]`);
    let newDateStr: string | null = null;
    
    // Check if we're dropping on a day container by looking at the over element's ancestors
    if (over.id.toString().includes("-")) {
      // Could be a task ID (uuid format), try to find the parent day
      const overElement = document.querySelector(`[data-droppable-date]`);
      if (overElement) {
        // Get all droppable days and find which one contains the mouse position
        const droppableDays = document.querySelectorAll('[data-droppable-date]');
        const rect = event.activatorEvent instanceof MouseEvent 
          ? { x: event.activatorEvent.clientX, y: event.activatorEvent.clientY }
          : null;
        
        if (rect) {
          for (const day of droppableDays) {
            const dayRect = day.getBoundingClientRect();
            if (rect.x >= dayRect.left && rect.x <= dayRect.right && 
                rect.y >= dayRect.top && rect.y <= dayRect.bottom) {
              newDateStr = day.getAttribute('data-droppable-date');
              break;
            }
          }
        }
      }
    }

    // Also check if the over element itself has the date attribute
    if (!newDateStr && over.id) {
      const overEl = document.getElementById(over.id.toString()) || 
                     document.querySelector(`[data-droppable-date="${over.id}"]`);
      if (overEl) {
        newDateStr = overEl.getAttribute('data-droppable-date');
      }
    }

    // If still no date, check the active event's final position
    if (!newDateStr && event.over) {
      const droppableDays = document.querySelectorAll('[data-droppable-date]');
      const delta = event.delta;
      const activeRect = event.active.rect.current.translated;
      
      if (activeRect) {
        for (const day of droppableDays) {
          const dayRect = day.getBoundingClientRect();
          const centerX = activeRect.left + activeRect.width / 2;
          const centerY = activeRect.top + activeRect.height / 2;
          
          if (centerX >= dayRect.left && centerX <= dayRect.right && 
              centerY >= dayRect.top && centerY <= dayRect.bottom) {
            newDateStr = day.getAttribute('data-droppable-date');
            break;
          }
        }
      }
    }

    if (!newDateStr) return;
    
    const currentDateStr = draggedTask.date_echeance;
    if (newDateStr === currentDateStr) return;

    const isCreator = draggedTask.created_by === currentEmployeeId;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === draggedTask.id ? { ...t, date_echeance: newDateStr! } : t
    ));

    try {
      if (isCreator) {
        const { error } = await supabase
          .from("tasks")
          .update({ date_echeance: newDateStr, updated_at: new Date().toISOString() })
          .eq("id", draggedTask.id);

        if (error) throw error;
        toast.success("Date modifiée");
      } else {
        const { error } = await supabase
          .from("tasks")
          .update({
            date_change_pending: true,
            date_change_requested_by: currentEmployeeId,
            date_change_requested_at: new Date().toISOString(),
            date_change_original_date: currentDateStr,
            date_change_new_date: newDateStr,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draggedTask.id);

        if (error) throw error;

        await supabase.from("notifications").insert({
          employee_id: draggedTask.created_by,
          titre: "📅 Changement de date demandé",
          message: `${currentEmployeeName} demande à déplacer "${draggedTask.titre}"`,
          type: "task_date_change_pending",
          url: "/taches",
        });

        toast.info("Demande envoyée au créateur");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du changement");
      fetchTasks();
    }
  };

  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: fr })} - ${format(addDays(currentWeekStart, 6), "d MMM yyyy", { locale: fr })}`;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{weekLabel}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(date => (
            <DroppableWeekDay
              key={format(date, "yyyy-MM-dd")}
              date={date}
              isToday={isSameDay(date, today)}
              tasks={getTasksForDate(date)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="p-3 rounded-lg border bg-card shadow-xl max-w-[200px]">
              <div className="font-medium text-sm">{activeTask.titre}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Card>
  );
};