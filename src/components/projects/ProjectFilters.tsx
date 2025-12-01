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

        {/* Filtre par statut */}
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
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
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
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
            <SelectTrigger>
              <SelectValue placeholder="Par défaut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default_desc">Par défaut</SelectItem>
              <SelectItem value="date_echeance_asc">📅 Échéance (proche → loin)</SelectItem>
              <SelectItem value="date_echeance_desc">📅 Échéance (loin → proche)</SelectItem>
              <SelectItem value="created_at_desc">🕐 Plus récent d'abord</SelectItem>
              <SelectItem value="created_at_asc">🕐 Plus ancien d'abord</SelectItem>
              <SelectItem value="priorite_desc">⭐ Prioritaires d'abord</SelectItem>
            </SelectContent>
          </Select>
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
