import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { AddEventDialog } from "./AddEventDialog";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarEvent {
  id: string;
  date: number;
  type: "indicateurs" | "absence" | "incident" | "formation" | "a_faire" | "horaire";
  label: string;
  validated?: boolean;
  source?: 'agenda' | 'task' | 'schedule';
}

export const MonthCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventSource, setSelectedEventSource] = useState<'agenda' | 'task' | 'schedule'>('agenda');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    if (!user) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Get user's employee record
    const { data: employeeData } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!employeeData) return;

    // Fetch agenda entries (absences, incidents, objectifs)
    const { data: agendaData, error: agendaError } = await supabase
      .from("agenda_entries")
      .select("*")
      .eq("employee_id", employeeData.id)
      .gte("date", firstDay)
      .lte("date", lastDay);

    // Fetch tasks (excluding completed ones)
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", employeeData.id)
      .gte("date_echeance", firstDay)
      .lte("date_echeance", lastDay)
      .neq("statut", "annulee")
      .neq("statut", "terminee");

    // Fetch work schedules
    const { data: schedulesData, error: schedulesError } = await supabase
      .from("work_schedules")
      .select("*")
      .eq("employee_id", employeeData.id)
      .gte("date", firstDay)
      .lte("date", lastDay);

    const mappedEvents: CalendarEvent[] = [];

    // Memoize parsed indicators for performance
    const parsedIndicators = useMemo(() => {
      if (!agendaData) return new Map();
      
      const map = new Map();
      agendaData.forEach(entry => {
        if (entry.categorie === 'indicateurs') {
          try {
            const parsed = JSON.parse(entry.detail);
            const data = Array.isArray(parsed) ? parsed[0] : parsed;
            map.set(entry.id, data?.nom || entry.detail);
          } catch {
            map.set(entry.id, entry.detail);
          }
        }
      });
      return map;
    }, [agendaData]);

    // Map agenda entries
    if (!agendaError && agendaData) {
      agendaData.forEach(entry => {
        // Skip validated indicators
        if (entry.categorie === 'indicateurs' && entry.statut_validation === 'valide') {
          return;
        }

        // Use memoized label for indicators
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

    // Map tasks (already filtered in query - no need for double check)
    if (!tasksError && tasksData) {
      tasksData.forEach(task => {
        mappedEvents.push({
          id: task.id,
          date: new Date(task.date_echeance).getDate(),
          type: "a_faire",
          label: task.titre,
          validated: false,
          source: 'task'
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
    setShowAddDialog(true);
  };

  const handleEventClick = (eventId: string, source: 'agenda' | 'task' | 'schedule', e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Ne pas ouvrir de détails pour les horaires de travail
    if (source === 'schedule') {
      return;
    }
    
    setSelectedEventId(eventId);
    setSelectedEventSource(source);
    setShowDetailsDialog(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };
  
  // Get days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Adjust for Monday start (0 = Sunday, we want 1 = Monday)
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDay }, (_, i) => i);
  
  const getEventsForDay = (day: number) => {
    return events.filter(e => e.date === day);
  };
  
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
          const events = getEventsForDay(day);
          const isToday = day === currentDate.getDate();
          
          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square border rounded-lg p-1 flex flex-col cursor-pointer
                ${isToday ? "border-primary bg-primary/5" : "border-border"}
                hover:bg-muted/50 transition-colors
              `}
            >
              <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>
                {day}
              </span>
              <div className="flex-1 flex flex-col gap-0.5 mt-1">
                {events.map((event, i) => (
                  <div
                    key={i}
                    onClick={(e) => handleEventClick(event.id, event.source || 'agenda', e)}
                    className={`text-[0.5rem] px-1 rounded ${getEventColor(event.type, event.validated)} truncate ${event.source === 'schedule' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'} transition-opacity`}
                    title={`${event.label}${event.type === 'absence' ? (event.validated ? ' (Validé)' : ' (En attente)') : ''}`}
                  >
                    {event.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

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
          <span>À faire</span>
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
        <AddEventDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          selectedDate={selectedDate}
          onEventAdded={fetchEvents}
        />
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
