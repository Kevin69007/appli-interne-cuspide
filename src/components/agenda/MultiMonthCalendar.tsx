import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, eachDayOfInterval, getDay } from "date-fns";
import { fr } from "date-fns/locale";

interface TaskEvent {
  id: string;
  titre: string;
  date_echeance: string;
  created_by: string;
}

interface DraggableMiniTask {
  task: TaskEvent;
}

const DraggableMiniTaskBadge = ({ task }: DraggableMiniTask) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `multi-${task.id}`,
    data: { task },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        w-2 h-2 rounded-full bg-blue-500 cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50 ring-2 ring-primary" : "hover:ring-1 hover:ring-primary"}
      `}
      title={task.titre}
    />
  );
};

interface DroppableMiniDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskEvent[];
}

const DroppableMiniDay = ({ date, isCurrentMonth, isToday, tasks }: DroppableMiniDayProps) => {
  const dateStr = format(date, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: `multiday-${dateStr}`,
    data: { date: dateStr },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        aspect-square flex flex-col items-center justify-center p-0.5 rounded text-xs
        ${!isCurrentMonth ? "text-muted-foreground/50" : ""}
        ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
        ${isOver ? "bg-primary/30 ring-1 ring-primary" : ""}
        ${isCurrentMonth && !isToday ? "hover:bg-muted/50" : ""}
        transition-colors cursor-pointer
      `}
    >
      <span>{format(date, "d")}</span>
      {tasks.length > 0 && (
        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full">
          {tasks.slice(0, 3).map(task => (
            <DraggableMiniTaskBadge key={task.id} task={task} />
          ))}
          {tasks.length > 3 && (
            <span className="text-[8px] text-muted-foreground">+{tasks.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

interface MiniMonthGridProps {
  month: Date;
  tasks: TaskEvent[];
  today: Date;
}

const MiniMonthGrid = ({ month, tasks, today }: MiniMonthGridProps) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDay = getDay(monthStart);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  // Get days to display including padding
  const daysToShow: Date[] = [];
  
  // Add padding days from previous month
  for (let i = adjustedStartDay - 1; i >= 0; i--) {
    daysToShow.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), -i));
  }
  
  // Add all days of current month
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  daysToShow.push(...allDays);
  
  // Add padding days for next month to complete the grid
  const remaining = 42 - daysToShow.length;
  for (let i = 1; i <= remaining; i++) {
    daysToShow.push(new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, i));
  }

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return tasks.filter(t => t.date_echeance === dateStr);
  };

  return (
    <div className="border rounded-lg p-3">
      <h4 className="text-sm font-semibold mb-2 text-center capitalize">
        {format(month, "MMMM yyyy", { locale: fr })}
      </h4>
      
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-0.5">
        {daysToShow.map((date, i) => (
          <DroppableMiniDay
            key={i}
            date={date}
            isCurrentMonth={date.getMonth() === month.getMonth()}
            isToday={isSameDay(date, today)}
            tasks={getTasksForDate(date)}
          />
        ))}
      </div>
    </div>
  );
};

export const MultiMonthCalendar = () => {
  const { user } = useAuth();
  const [startMonth, setStartMonth] = useState(() => startOfMonth(new Date()));
  const [tasks, setTasks] = useState<TaskEvent[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [activeTask, setActiveTask] = useState<TaskEvent | null>(null);

  const months = [startMonth, addMonths(startMonth, 1), addMonths(startMonth, 2)];
  const today = new Date();

  useEffect(() => {
    fetchEmployeeInfo();
  }, [user]);

  useEffect(() => {
    if (currentEmployeeId) {
      fetchTasks();
    }
  }, [startMonth, currentEmployeeId]);

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

    const rangeStart = format(startMonth, "yyyy-MM-dd");
    const rangeEnd = format(endOfMonth(addMonths(startMonth, 2)), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("tasks")
      .select("id, titre, date_echeance, created_by")
      .eq("assigned_to", currentEmployeeId)
      .gte("date_echeance", rangeStart)
      .lte("date_echeance", rangeEnd)
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
    if (!overId.startsWith("multiday-")) return;

    const newDateStr = overId.replace("multiday-", "");
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

  const periodLabel = `${format(startMonth, "MMM yyyy", { locale: fr })} - ${format(addMonths(startMonth, 2), "MMM yyyy", { locale: fr })}`;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold capitalize">{periodLabel}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setStartMonth(prev => subMonths(prev, 3))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStartMonth(startOfMonth(new Date()))}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" onClick={() => setStartMonth(prev => addMonths(prev, 3))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {months.map(month => (
            <MiniMonthGrid
              key={format(month, "yyyy-MM")}
              month={month}
              tasks={tasks}
              today={today}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="px-2 py-1 rounded bg-primary text-primary-foreground shadow-lg text-xs">
              {activeTask.titre}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className="mt-4 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Tâche (glisser pour déplacer)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold">J</div>
          <span>Aujourd'hui</span>
        </div>
      </div>
    </Card>
  );
};
