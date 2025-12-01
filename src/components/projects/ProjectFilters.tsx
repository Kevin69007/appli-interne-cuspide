import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ProjectFilters {
  responsableId: string | null;
  dateDebut: Date | null;
  dateFin: Date | null;
}

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  responsables: Array<{ id: string; nom: string; prenom: string }>;
  totalProjects: number;
  filteredCount: number;
}

export const ProjectFilters = ({
  filters,
  onFiltersChange,
  responsables,
  totalProjects,
  filteredCount,
}: ProjectFiltersProps) => {
  const activeFiltersCount =
    (filters.responsableId ? 1 : 0) +
    (filters.dateDebut || filters.dateFin ? 1 : 0);

  const handleReset = () => {
    onFiltersChange({
      responsableId: null,
      dateDebut: null,
      dateFin: null,
    });
  };

  return (
    <div className="space-y-4 mb-6 p-4 bg-card rounded-lg border border-border">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filtre par responsable */}
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
            👤 Responsable
          </label>
          <Select
            value={filters.responsableId || "tous"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                responsableId: value === "tous" ? null : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les responsables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les responsables</SelectItem>
              {responsables.map((resp) => (
                <SelectItem key={resp.id} value={resp.id}>
                  {resp.prenom} {resp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par date de début */}
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
            📅 Date début échéance
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateDebut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateDebut
                  ? format(filters.dateDebut, "PPP", { locale: fr })
                  : "Toutes dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateDebut || undefined}
                onSelect={(date) =>
                  onFiltersChange({ ...filters, dateDebut: date || null })
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Filtre par date de fin */}
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
            📅 Date fin échéance
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateFin && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFin
                  ? format(filters.dateFin, "PPP", { locale: fr })
                  : "Toutes dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFin || undefined}
                onSelect={(date) =>
                  onFiltersChange({ ...filters, dateFin: date || null })
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Barre d'info et réinitialisation */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="animate-fade-in">
              🔍 {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""}{" "}
              actif{activeFiltersCount > 1 ? "s" : ""}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {filteredCount} / {totalProjects} projet{totalProjects > 1 ? "s" : ""}
          </span>
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
};
