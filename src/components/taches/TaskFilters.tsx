import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { Search, Calendar as CalendarIcon, X, Flame, Clock, Target, Calendar as CalendarCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, subDays, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export interface TaskFilters {
  searchTerm: string;
  statut: string[];
  priorite: string[];
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

const statusOptions = [
  { value: "en_cours", label: "🟢 En cours" },
  { value: "terminee", label: "✅ Terminées" },
  { value: "a_venir", label: "🔵 À venir" },
  { value: "en_attente_validation", label: "⏳ En attente validation" },
];

const priorityOptions = [
  { value: "haute", label: "🔴 Haute" },
  { value: "normale", label: "🔵 Normale" },
  { value: "basse", label: "🟢 Basse" },
];

export const TaskFilters = ({ onFilterChange, taskCount }: TaskFiltersProps) => {
  const { t } = useTranslation('tasks');
  // Filtres en cours de configuration (pas encore appliqués)
  const [pendingFilters, setPendingFilters] = useState<TaskFilters>({
    searchTerm: "",
    statut: [],
    priorite: [],
    dateDebut: null,
    dateFin: null,
    hideCompleted: true,
  });

  // Filtres actuellement appliqués
  const [appliedFilters, setAppliedFilters] = useState<TaskFilters>({
    searchTerm: "",
    statut: [],
    priorite: [],
    dateDebut: null,
    dateFin: null,
    hideCompleted: true,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Check if filters have been modified but not applied
  const hasUnappliedChanges = JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);

  const updatePendingFilter = (key: keyof TaskFilters, value: any) => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    onFilterChange(pendingFilters);
    localStorage.setItem("taskFilters", JSON.stringify(pendingFilters));
  };

  const resetFilters = () => {
    const emptyFilters: TaskFilters = {
      searchTerm: "",
      statut: [],
      priorite: [],
      dateDebut: null,
      dateFin: null,
      hideCompleted: false,
    };
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    onFilterChange(emptyFilters);
    localStorage.removeItem("taskFilters");
  };

  // Quick filter presets - apply immediately
  const applyPreset = (preset: string) => {
    const today = startOfToday();
    let newFilters: TaskFilters;
    
    switch (preset) {
      case "urgent":
        newFilters = {
          searchTerm: "",
          statut: ["en_cours"],
          priorite: ["haute"],
          dateDebut: null,
          dateFin: endOfWeek(today, { locale: fr }),
          hideCompleted: true,
        };
        break;
      case "overdue":
        newFilters = {
          searchTerm: "",
          statut: ["en_cours"],
          priorite: [],
          dateDebut: null,
          dateFin: subDays(today, 1),
          hideCompleted: true,
        };
        break;
      case "today":
        newFilters = {
          searchTerm: "",
          statut: [],
          priorite: [],
          dateDebut: today,
          dateFin: today,
          hideCompleted: false,
        };
        break;
      case "thisWeek":
        newFilters = {
          searchTerm: "",
          statut: [],
          priorite: [],
          dateDebut: startOfWeek(today, { locale: fr }),
          dateFin: endOfWeek(today, { locale: fr }),
          hideCompleted: false,
        };
        break;
      case "completed":
        newFilters = {
          searchTerm: "",
          statut: ["terminee"],
          priorite: [],
          dateDebut: subDays(today, 7),
          dateFin: today,
          hideCompleted: false,
        };
        break;
      default:
        return;
    }
    
    // Presets apply immediately
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const activeFilterCount = [
    appliedFilters.searchTerm && appliedFilters.searchTerm.length > 0,
    appliedFilters.statut.length > 0,
    appliedFilters.priorite.length > 0,
    appliedFilters.dateDebut !== null,
    appliedFilters.dateFin !== null,
    appliedFilters.hideCompleted === true,
  ].filter(Boolean).length;

  // Handle Enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  // Handle date range selection
  const dateRange: DateRange | undefined = pendingFilters.dateDebut 
    ? { from: pendingFilters.dateDebut, to: pendingFilters.dateFin || undefined }
    : undefined;

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setPendingFilters((prev) => ({
      ...prev,
      dateDebut: range?.from || null,
      dateFin: range?.to || null,
    }));
  };

  return (
    <Card className="p-3 sm:p-4 mb-4 sm:mb-6 bg-accent/50">
      {/* Quick Filter Presets */}
      <div className="flex overflow-x-auto gap-2 mb-3 sm:mb-4 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-thin">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("urgent")}
          className="text-xs shrink-0"
        >
          <Flame className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Urgentes</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("overdue")}
          className="text-xs shrink-0"
        >
          <Clock className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">En retard</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("today")}
          className="text-xs shrink-0"
        >
          <Target className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Aujourd'hui</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("thisWeek")}
          className="text-xs shrink-0"
        >
          <CalendarCheck className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Semaine</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("completed")}
          className="text-xs shrink-0"
        >
          <CheckCircle2 className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Terminées</span>
        </Button>
      </div>

      {/* Main Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Titre ou description..."
              value={pendingFilters.searchTerm}
              onChange={(e) => updatePendingFilter("searchTerm", e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-8"
            />
          </div>
        </div>

        {/* Status - MultiSelect */}
        <div className="space-y-2">
          <Label className="text-xs">Statut</Label>
          <MultiSelect
            selectedValues={pendingFilters.statut}
            onSelectedValuesChange={(values) => updatePendingFilter("statut", values)}
            options={statusOptions}
            placeholder="Tous les statuts"
            searchPlaceholder="Rechercher un statut..."
          />
        </div>

        {/* Priority - MultiSelect */}
        <div className="space-y-2">
          <Label className="text-xs">Priorité</Label>
          <MultiSelect
            selectedValues={pendingFilters.priorite}
            onSelectedValuesChange={(values) => updatePendingFilter("priorite", values)}
            options={priorityOptions}
            placeholder="Toutes priorités"
            searchPlaceholder="Rechercher une priorité..."
          />
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-xs">Date d'échéance</Label>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {pendingFilters.dateDebut ? (
                  pendingFilters.dateFin ? (
                    <>
                      {format(pendingFilters.dateDebut, "dd/MM/yy")} - {format(pendingFilters.dateFin, "dd/MM/yy")}
                    </>
                  ) : (
                    format(pendingFilters.dateDebut, "dd/MM/yyyy")
                  )
                ) : (
                  <span className="text-muted-foreground">Toutes les dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-3">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  locale={fr}
                  numberOfMonths={2}
                  className={cn("pointer-events-auto")}
                />
                <div className="flex gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleDateRangeSelect(undefined);
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

      {/* Hide Completed Checkbox */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hideCompleted"
            checked={pendingFilters.hideCompleted}
            onCheckedChange={(checked) => updatePendingFilter("hideCompleted", checked)}
          />
          <label
            htmlFor="hideCompleted"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Masquer les tâches terminées
          </label>
        </div>
      </div>

      {/* Warning for unapplied changes */}
      {hasUnappliedChanges && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span className="text-sm text-orange-600 dark:text-orange-400">
            Filtres modifiés - Cliquez sur <strong>Rechercher</strong> pour appliquer
          </span>
        </div>
      )}

      {/* Bottom Bar: Active Filters + Reset */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t gap-3 sm:gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              🔍 {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {taskCount.filtered} / {taskCount.total} tâche{taskCount.total > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="default" 
            size="sm" 
            onClick={applyFilters}
            disabled={!hasUnappliedChanges}
            className="gap-1 flex-1 sm:flex-none"
          >
            <Search className="h-3 w-3" />
            <span className="hidden sm:inline">Rechercher</span>
            <span className="sm:hidden">OK</span>
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 flex-1 sm:flex-none">
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Réinitialiser</span>
              <span className="sm:hidden">Reset</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
