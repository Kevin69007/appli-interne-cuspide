import { useMemo } from "react";
import { differenceInDays, parseISO, isAfter, isBefore, isWithinInterval } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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

interface GanttBarProps {
  task: Task;
  monthStart: Date;
  monthEnd: Date;
  projectCreatedAt: string;
  onClick: () => void;
}

export const GanttBar = ({ task, monthStart, monthEnd, projectCreatedAt, onClick }: GanttBarProps) => {
  const { position, width, color, visible } = useMemo(() => {
    const startDate = task.date_debut ? parseISO(task.date_debut) : parseISO(projectCreatedAt);
    const endDate = parseISO(task.date_echeance);
    const today = new Date();

    // Check if task overlaps with current month
    const taskVisible = isWithinInterval(startDate, { start: monthStart, end: monthEnd }) ||
                       isWithinInterval(endDate, { start: monthStart, end: monthEnd }) ||
                       (isBefore(startDate, monthStart) && isAfter(endDate, monthEnd));

    if (!taskVisible) {
      return { position: 0, width: 0, color: "", visible: false };
    }

    // Calculate position and width
    const displayStart = isBefore(startDate, monthStart) ? monthStart : startDate;
    const displayEnd = isAfter(endDate, monthEnd) ? monthEnd : endDate;
    
    const totalDaysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const daysSinceMonthStart = differenceInDays(displayStart, monthStart);
    const taskDurationInMonth = differenceInDays(displayEnd, displayStart) + 1;
    
    const positionPercent = (daysSinceMonthStart / totalDaysInMonth) * 100;
    const widthPercent = (taskDurationInMonth / totalDaysInMonth) * 100;

    // Determine color based on status
    let barColor = "";
    if (task.statut === "terminee") {
      barColor = "bg-green-500 hover:bg-green-600";
    } else if (task.statut === "en_cours") {
      barColor = "bg-blue-500 hover:bg-blue-600";
    } else if (isAfter(today, endDate)) {
      barColor = "bg-red-500 hover:bg-red-600";
    } else {
      barColor = "bg-yellow-500 hover:bg-yellow-600";
    }

    return {
      position: positionPercent,
      width: widthPercent,
      color: barColor,
      visible: true,
    };
  }, [task, monthStart, monthEnd, projectCreatedAt]);

  if (!visible) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative h-10 cursor-pointer" onClick={onClick}>
            <div
              className={cn(
                "absolute h-8 rounded transition-all duration-200",
                color,
                task.is_priority && "ring-2 ring-orange-500 ring-offset-2"
              )}
              style={{
                left: `${position}%`,
                width: `${width}%`,
              }}
            >
              {/* Progress indicator */}
              <div
                className="absolute inset-0 bg-white/30 rounded"
                style={{ width: `${task.progression}%` }}
              />
              
              {/* Task title (if space allows) */}
              {width > 15 && (
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-xs text-white font-medium truncate">
                    {task.titre}
                  </span>
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{task.titre}</p>
            <p className="text-sm">Échéance: {new Date(task.date_echeance).toLocaleDateString("fr-FR")}</p>
            <p className="text-sm">Progression: {task.progression}%</p>
            {task.responsable && (
              <p className="text-sm">
                Responsable: {task.responsable.prenom} {task.responsable.nom}
              </p>
            )}
            {task.is_priority && (
              <p className="text-sm text-orange-500 font-medium">⭐ Prioritaire</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
