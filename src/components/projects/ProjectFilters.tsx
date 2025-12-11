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
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";

export interface ProjectFilters {
  responsableId: string | null;
  statut: string[];
  sortBy: string | null;
  sortOrder: "asc" | "desc";
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
    (filters.statut.length > 0 ? 1 : 0) +
    (filters.sortBy ? 1 : 0);

  const handleReset = () => {
    onFiltersChange({
      responsableId: null,
      statut: [],
      sortBy: null,
      sortOrder: "desc",
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-card rounded-lg border border-border">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Filtre par responsable */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
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
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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

          {/* Filtre par statut */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
              📊 Statut
            </label>
            <MultiSelect
              selectedValues={filters.statut}
              onSelectedValuesChange={(values) =>
                onFiltersChange({ ...filters, statut: values })
              }
              options={[
                { value: "en_cours", label: "🟢 En cours" },
                { value: "a_venir", label: "🔵 À venir" },
                { value: "en_pause", label: "🟠 En pause" },
                { value: "termine", label: "✅ Terminé" },
              ]}
              placeholder="Tous les statuts"
            />
          </div>

          {/* Tri */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
              ↕️ Trier par
            </label>
            <Select
              value={`${filters.sortBy || "default"}_${filters.sortOrder}`}
              onValueChange={(value) => {
                if (value === "default_desc") {
                  onFiltersChange({ ...filters, sortBy: null, sortOrder: "desc" });
                  return;
                }
                const lastUnderscoreIndex = value.lastIndexOf("_");
                const sortBy = value.substring(0, lastUnderscoreIndex);
                const sortOrder = value.substring(lastUnderscoreIndex + 1) as "asc" | "desc";
                onFiltersChange({ ...filters, sortBy, sortOrder });
              }}
            >
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Par défaut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default_desc">Par défaut</SelectItem>
                <SelectItem value="date_echeance_asc">📅 Échéance (proche)</SelectItem>
                <SelectItem value="date_echeance_desc">📅 Échéance (loin)</SelectItem>
                <SelectItem value="created_at_desc">🕐 Plus récent</SelectItem>
                <SelectItem value="created_at_asc">🕐 Plus ancien</SelectItem>
                <SelectItem value="priorite_desc">⭐ Prioritaires</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Barre d'info et réinitialisation */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="animate-fade-in text-xs">
              🔍 {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""}
            </Badge>
          )}
          <span className="text-xs sm:text-sm text-muted-foreground">
            {filteredCount} / {totalProjects} projet{totalProjects > 1 ? "s" : ""}
          </span>
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 h-7 sm:h-8 text-xs sm:text-sm"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
};
