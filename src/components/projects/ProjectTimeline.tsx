import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GanttBar } from "./GanttBar";

interface Task {
  id: string;
  titre: string;
  date_debut?: string;
  date_echeance: string;
  statut: string;
  progression: number;
  is_priority: boolean;
  responsable?: {
    prenom: string;
    nom: string;
  };
}

interface ProjectTimelineProps {
  tasks: Task[];
  projectCreatedAt: string;
  onTaskClick: (taskId: string) => void;
}

export const ProjectTimeline = ({ tasks, projectCreatedAt, onTaskClick }: ProjectTimelineProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h3>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Timeline grid */}
      <div className="relative">
        {/* Days header */}
        <div className="flex border-b border-border pb-2 mb-4">
          {daysInMonth.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 text-center text-xs text-muted-foreground"
            >
              {format(day, "d")}
            </div>
          ))}
        </div>

        {/* Tasks bars */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune tâche pour ce mois
            </p>
          ) : (
            tasks.map((task) => (
              <GanttBar
                key={task.id}
                task={task}
                monthStart={monthStart}
                monthEnd={monthEnd}
                projectCreatedAt={projectCreatedAt}
                onClick={() => onTaskClick(task.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-4 border-t border-border text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-muted-foreground">Terminée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-muted-foreground">En cours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-muted-foreground">À venir</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-muted-foreground">En retard</span>
        </div>
      </div>
    </div>
  );
};
