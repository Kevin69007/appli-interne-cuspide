import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, GripVertical, Flag, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
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
}

interface DraggableTaskCardProps {
  task: TaskEvent;
}

const DraggableTaskCard = ({ task }: DraggableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

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
        ${isDragging ? "opacity-50 shadow-lg ring-2 ring-primary" : "hover:shadow-md hover:border-primary/50"}
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
  const { setNodeRef, isOver } = useDroppable({
    id: `weekday-${dateStr}`,
    data: { date: dateStr },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-[300px] border rounded-lg overflow-hidden
        ${isToday ? "border-primary bg-primary/5" : "border-border"}
        ${isOver ? "bg-primary/10 border-primary" : ""}
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
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Aucune tâche
          </div>
        ) : (
          tasks.map(task => (
            <DraggableTaskCard key={task.id} task={task} />
          ))
        )}
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
      .select("id, titre, date_echeance, priorite, statut, is_priority, created_by")
      .eq("assigned_to", currentEmployeeId)
      .gte("date_echeance", startStr)
      .lte("date_echeance", endStr)
      .neq("statut", "annulee")
      .neq("statut", "terminee");

    if (!error && data) {
      setTasks(data);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as TaskEvent;
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over || !currentEmployeeId) return;

    const draggedTask = active.data.current?.task as TaskEvent;
    if (!draggedTask) return;

    const overId = over.id as string;
    if (!overId.startsWith("weekday-")) return;

    const newDateStr = overId.replace("weekday-", "");
    const currentDateStr = draggedTask.date_echeance;

    if (newDateStr === currentDateStr) return;

    const isCreator = draggedTask.created_by === currentEmployeeId;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === draggedTask.id ? { ...t, date_echeance: newDateStr } : t
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

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return tasks.filter(t => t.date_echeance === dateStr);
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
        collisionDetection={closestCenter}
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
