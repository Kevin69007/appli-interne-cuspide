import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { AddEventDialog } from "./AddEventDialog";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { DayPlanningDialog } from "@/components/agenda/DayPlanningDialog";
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

interface CalendarEvent {
  id: string;
  date: number;
  type: "indicateurs" | "absence" | "incident" | "formation" | "a_faire" | "horaire";
  label: string;
  validated?: boolean;
  source?: 'agenda' | 'task' | 'schedule';
  taskData?: {
    created_by: string;
    date_echeance: string;
  };
}

interface DraggableTaskProps {
  event: CalendarEvent;
}

const DraggableTaskBadge = ({ event }: DraggableTaskProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
    disabled: event.source !== 'task',
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const getEventColor = (type: string, validated?: boolean) => {
    switch (type) {
      case "indicateurs": return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "a_faire": return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "horaire": return "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400";
      case "absence": 
        return validated 
          ? "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-l-2 border-purple-500"
          : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-l-2 border-yellow-500";
      case "incident": return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
      default: return "bg-muted";
    }
  };

  if (event.source !== 'task') {
    return (
      <div
        className={`text-[0.5rem] px-1 rounded ${getEventColor(event.type, event.validated)} truncate ${event.source === 'schedule' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'} transition-opacity`}
        title={`${event.label}${event.type === 'absence' ? (event.validated ? ' (Validé)' : ' (En attente)') : ''}`}
      >
        {event.label}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        text-[0.5rem] px-1 rounded ${getEventColor(event.type, event.validated)} truncate 
        cursor-grab active:cursor-grabbing transition-all
        ${isDragging ? "opacity-50 shadow-lg ring-2 ring-primary" : "hover:opacity-80"}
      `}
      title={`${event.label} (glisser pour déplacer)`}
    >
      {event.label}
    </div>
  );
};

interface DroppableDayProps {
  day: number;
  isToday: boolean;
  events: CalendarEvent[];
  onDayClick: (day: number) => void;
  onEventClick: (eventId: string, source: 'agenda' | 'task' | 'schedule', e: React.MouseEvent) => void;
}

const DroppableDay = ({ day, isToday, events, onDayClick, onEventClick }: DroppableDayProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
    data: { day },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDayClick(day)}
      className={`
        aspect-square border rounded-lg p-1 flex flex-col cursor-pointer
        ${isToday ? "border-primary bg-primary/5" : "border-border"}
        ${isOver ? "bg-primary/20 border-primary" : ""}
        hover:bg-muted/50 transition-colors
      `}
    >
      <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>
        {day}
      </span>
      <div className="flex-1 flex flex-col gap-0.5 mt-1">
        {events.map((event, i) => (
          <div key={i} onClick={(e) => onEventClick(event.id, event.source || 'agenda', e)}>
            <DraggableTaskBadge event={event} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const MonthCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDayPlanningDialog, setShowDayPlanningDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventSource, setSelectedEventSource] = useState<'agenda' | 'task' | 'schedule'>('agenda');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  useEffect(() => {
    fetchEmployeeInfo();
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, currentEmployeeId]);

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

  const fetchEvents = async () => {
    if (!user || !currentEmployeeId) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Fetch agenda entries
    const { data: agendaData, error: agendaError } = await supabase
      .from("agenda_entries")
      .select("*")
      .eq("employee_id", currentEmployeeId)
      .gte("date", firstDay)
      .lte("date", lastDay);

    // Fetch tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*, created_by")
      .eq("assigned_to", currentEmployeeId)
      .gte("date_echeance", firstDay)
      .lte("date_echeance", lastDay)
      .neq("statut", "annulee")
      .neq("statut", "terminee");

    // Fetch work schedules
    const { data: schedulesData, error: schedulesError } = await supabase
      .from("work_schedules")
      .select("*")
      .eq("employee_id", currentEmployeeId)
      .gte("date", firstDay)
      .lte("date", lastDay);

    const mappedEvents: CalendarEvent[] = [];

    // Parse indicators
    const parsedIndicators = new Map<string, string>();
    if (agendaData) {
      agendaData.forEach((entry: any) => {
        if (entry.categorie === 'indicateurs') {
          try {
            const parsed = JSON.parse(entry.detail);
            const data = Array.isArray(parsed) ? parsed[0] : parsed;
            parsedIndicators.set(entry.id, data?.nom || entry.detail);
          } catch {
            parsedIndicators.set(entry.id, entry.detail);
          }
        }
      });
    }

    // Map agenda entries
    if (!agendaError && agendaData) {
      agendaData.forEach(entry => {
        if (entry.categorie === 'indicateurs' && entry.statut_validation === 'valide') return;

        const label = entry.categorie === 'indicateurs' 
          ? parsedIndicators.get(entry.id) || entry.detail
          : entry.detail || entry.categorie;

        mappedEvents.push({
          id: entry.id,
          date: new Date(entry.date).getDate(),
          type: entry.categorie as any,
          label,
          validated: entry.statut_validation === 'valide',
          source: 'agenda'
        });
      });
    }

    // Map tasks
    if (!tasksError && tasksData) {
      tasksData.forEach(task => {
        mappedEvents.push({
          id: task.id,
          date: new Date(task.date_echeance).getDate(),
          type: "a_faire",
          label: task.titre,
          validated: false,
          source: 'task',
          taskData: {
            created_by: task.created_by,
            date_echeance: task.date_echeance,
          }
        });
      });
    }

    // Map work schedules
    if (!schedulesError && schedulesData) {
      schedulesData.forEach(schedule => {
        mappedEvents.push({
          id: schedule.id,
          date: new Date(schedule.date).getDate(),
          type: "horaire",
          label: `${schedule.heure_debut} - ${schedule.heure_fin}`,
          source: 'schedule'
        });
      });
    }

    setEvents(mappedEvents);
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowDayPlanningDialog(true);
  };

  const handleEventClick = (eventId: string, source: 'agenda' | 'task' | 'schedule', e: React.MouseEvent) => {
    e.stopPropagation();
    if (source === 'schedule') return;
    
    setSelectedEventId(eventId);
    setSelectedEventSource(source);
    setShowDetailsDialog(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = event.active.data.current?.event as CalendarEvent;
    setActiveEvent(draggedEvent);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveEvent(null);
    const { active, over } = event;
    
    if (!over || !currentEmployeeId) return;

    const draggedEvent = active.data.current?.event as CalendarEvent;
    if (!draggedEvent || draggedEvent.source !== 'task') return;

    const overId = over.id as string;
    if (!overId.startsWith("day-")) return;

    const newDay = parseInt(overId.replace("day-", ""));
    const currentDay = draggedEvent.date;

    if (newDay === currentDay) return;

    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), newDay);
    const newDateStr = newDate.toISOString().split('T')[0];
    const taskId = draggedEvent.id;

    const isCreator = draggedEvent.taskData?.created_by === currentEmployeeId;

    try {
      if (isCreator) {
        // Creator can change date directly
        const { error } = await supabase
          .from("tasks")
          .update({ 
            date_echeance: newDateStr,
            updated_at: new Date().toISOString()
          })
          .eq("id", taskId);

        if (error) throw error;
        toast.success("Date de la tâche modifiée");
      } else {
        // Non-creator must request date change
        const { error } = await supabase
          .from("tasks")
          .update({ 
            date_change_pending: true,
            date_change_requested_by: currentEmployeeId,
            date_change_requested_at: new Date().toISOString(),
            date_change_original_date: draggedEvent.taskData?.date_echeance,
            date_change_new_date: newDateStr,
            updated_at: new Date().toISOString()
          })
          .eq("id", taskId);

        if (error) throw error;

        // Notify the creator
        await supabase.from("notifications").insert({
          employee_id: draggedEvent.taskData?.created_by,
          titre: "📅 Changement de date demandé",
          message: `${currentEmployeeName} demande à déplacer la tâche "${draggedEvent.label}"`,
          type: "task_date_change_pending",
          url: "/taches",
        });

        toast.info("Demande de changement de date envoyée au créateur");
      }

      fetchEvents();
    } catch (error) {
      console.error("Error updating task date:", error);
      toast.error("Erreur lors du changement de date");
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDay }, (_, i) => i);
  
  const getEventsForDay = (day: number) => events.filter(e => e.date === day);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isCurrentMonth && day === today.getDate();
            
            return (
              <DroppableDay
                key={day}
                day={day}
                isToday={isToday}
                events={dayEvents}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeEvent && (
            <div className="text-[0.6rem] px-2 py-1 rounded bg-primary text-primary-foreground shadow-lg">
              {activeEvent.label}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-500/20" />
          <span>Horaires de travail</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/20" />
          <span>Indicateurs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/20" />
          <span>Tâches (glisser-déposer)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500/20 border-l-2 border-purple-500" />
          <span>Absences validées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500/20 border-l-2 border-yellow-500" />
          <span>Absences en attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500/20" />
          <span>Incidents</span>
        </div>
      </div>

      {selectedDate && (
        <>
          <AddEventDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            selectedDate={selectedDate}
            onEventAdded={fetchEvents}
          />
          <DayPlanningDialog
            open={showDayPlanningDialog}
            onOpenChange={setShowDayPlanningDialog}
            selectedDate={selectedDate}
            onUpdate={fetchEvents}
          />
        </>
      )}

      {selectedEventId && selectedEventSource !== 'schedule' && (
        <EventDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          eventId={selectedEventId}
          source={selectedEventSource}
          onUpdate={fetchEvents}
        />
      )}
    </Card>
  );
};