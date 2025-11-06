import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar as CalendarIcon, X, Flame, Clock, Target, Calendar as CalendarCheck, CheckCircle2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isAfter, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface TaskFilters {
  searchTerm: string;
  statut: string | null;
  priorite: string | null;
  dateDebut: Date | null;
  dateFin: Date | null;
  hideCompleted: boolean;
}

interface TaskFiltersProps {
  onFilterChange: (filters: TaskFilters) => void;
  taskCount: {
    total: number;
    filtered: number;
  };
}

export const TaskFilters = ({ onFilterChange, taskCount }: TaskFiltersProps) => {
  const [filters, setFilters] = useState<TaskFilters>({
    searchTerm: "",
    statut: null,
    priorite: null,
    dateDebut: null,
    dateFin: null,
    hideCompleted: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("taskFilters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        // Convert date strings back to Date objects
        if (parsed.dateDebut) parsed.dateDebut = new Date(parsed.dateDebut);
        if (parsed.dateFin) parsed.dateFin = new Date(parsed.dateFin);
        setFilters(parsed);
        onFilterChange(parsed);
      } catch (e) {
        console.error("Error loading filters:", e);
      }
    }
  }, []);

  // Save filters to localStorage and notify parent
  useEffect(() => {
    localStorage.setItem("taskFilters", JSON.stringify(filters));
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    const emptyFilters: TaskFilters = {
      searchTerm: "",
      statut: null,
      priorite: null,
      dateDebut: null,
      dateFin: null,
      hideCompleted: false,
    };
    setFilters(emptyFilters);
    localStorage.removeItem("taskFilters");
  };

  // Quick filter presets
  const applyPreset = (preset: string) => {
    const today = startOfToday();
    switch (preset) {
      case "urgent":
        setFilters({
          searchTerm: "",
          statut: "en_cours",
          priorite: "haute",
          dateDebut: null,
          dateFin: endOfWeek(today, { locale: fr }),
          hideCompleted: true,
        });
        break;
      case "overdue":
        setFilters({
          searchTerm: "",
          statut: "en_cours",
          priorite: null,
          dateDebut: null,
          dateFin: subDays(today, 1),
          hideCompleted: true,
        });
        break;
      case "today":
        setFilters({
          searchTerm: "",
          statut: null,
          priorite: null,
          dateDebut: today,
          dateFin: today,
          hideCompleted: false,
        });
        break;
      case "thisWeek":
        setFilters({
          searchTerm: "",
          statut: null,
          priorite: null,
          dateDebut: startOfWeek(today, { locale: fr }),
          dateFin: endOfWeek(today, { locale: fr }),
          hideCompleted: false,
        });
        break;
      case "completed":
        setFilters({
          searchTerm: "",
          statut: "terminee",
          priorite: null,
          dateDebut: subDays(today, 7),
          dateFin: today,
          hideCompleted: false,
        });
        break;
    }
  };

  const activeFilterCount = [
    filters.searchTerm,
    filters.statut,
    filters.priorite,
    filters.dateDebut,
    filters.dateFin,
    filters.hideCompleted,
  ].filter(Boolean).length;

  return (
    <Card className="p-4 mb-6 bg-accent/50">
      {/* Quick Filter Presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("urgent")}
          className="text-xs"
        >
          <Flame className="h-3 w-3 mr-1" />
          Urgentes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("overdue")}
          className="text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          En retard
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("today")}
          className="text-xs"
        >
          <Target className="h-3 w-3 mr-1" />
          Aujourd'hui
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("thisWeek")}
          className="text-xs"
        >
          <CalendarCheck className="h-3 w-3 mr-1" />
          Cette semaine
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("completed")}
          className="text-xs"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Terminées récemment
        </Button>
      </div>

      {/* Main Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Titre ou description..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter("searchTerm", e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-xs">Statut</Label>
          <Select
            value={filters.statut || "all"}
            onValueChange={(value) => updateFilter("statut", value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="terminee">Terminées</SelectItem>
              <SelectItem value="a_venir">À venir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label className="text-xs">Priorité</Label>
          <Select
            value={filters.priorite || "all"}
            onValueChange={(value) => updateFilter("priorite", value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes priorités" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="haute">🔴 Haute</SelectItem>
              <SelectItem value="normale">🔵 Normale</SelectItem>
              <SelectItem value="basse">🟢 Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-xs">Date d'échéance</Label>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateDebut ? (
                  filters.dateFin ? (
                    <>
                      {format(filters.dateDebut, "dd/MM/yy")} - {format(filters.dateFin, "dd/MM/yy")}
                    </>
                  ) : (
                    format(filters.dateDebut, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Toutes les dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date de début</Label>
                  <Calendar
                    mode="single"
                    selected={filters.dateDebut || undefined}
                    onSelect={(date) => updateFilter("dateDebut", date || null)}
                    locale={fr}
                    className="pointer-events-auto"
                  />
                </div>
                {filters.dateDebut && (
                  <div className="space-y-1">
                    <Label className="text-xs">Date de fin (optionnel)</Label>
                    <Calendar
                      mode="single"
                      selected={filters.dateFin || undefined}
                      onSelect={(date) => updateFilter("dateFin", date || null)}
                      locale={fr}
                      disabled={(date) => filters.dateDebut ? date < filters.dateDebut : false}
                      className="pointer-events-auto"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateFilter("dateDebut", null);
                      updateFilter("dateFin", null);
                      setShowDatePicker(false);
                    }}
                  >
                    Effacer
                  </Button>
                  <Button size="sm" onClick={() => setShowDatePicker(false)}>
                    OK
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Bottom Bar: Active Filters + Reset */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              🔍 {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {taskCount.filtered} sur {taskCount.total} tâche{taskCount.total > 1 ? "s" : ""}
          </span>
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-3 w-3 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>
    </Card>
  );
};
