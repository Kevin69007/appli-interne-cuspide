import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar, Grid3X3 } from "lucide-react";

export type CalendarView = "week" | "month" | "multi";

interface CalendarViewSelectorProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export const CalendarViewSelector = ({ currentView, onViewChange }: CalendarViewSelectorProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant={currentView === "week" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("week")}
        className="h-8"
      >
        <CalendarDays className="h-4 w-4 mr-1.5" />
        Semaine
      </Button>
      <Button
        variant={currentView === "month" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("month")}
        className="h-8"
      >
        <Calendar className="h-4 w-4 mr-1.5" />
        Mois
      </Button>
      <Button
        variant={currentView === "multi" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("multi")}
        className="h-8"
      >
        <Grid3X3 className="h-4 w-4 mr-1.5" />
        3 Mois
      </Button>
    </div>
  );
};
