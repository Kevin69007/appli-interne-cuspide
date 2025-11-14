import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Calendar as CalendarIcon, X, Flame, Clock, Target, Calendar as CalendarCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, subDays, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";

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
  const { t } = useTranslation('tasks');
  // Filtres en cours de configuration (pas encore appliqués)
  const [pendingFilters, setPendingFilters] = useState<TaskFilters>({
    searchTerm: "",
    statut: null,
    priorite: null,
    dateDebut: null,
    dateFin: null,
    hideCompleted: true,
  });

  // Filtres actuellement appliqués
  const [appliedFilters, setAppliedFilters] = useState<TaskFilters>({
    searchTerm: "",
    statut: null,
    priorite: null,
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
      statut: null,
      priorite: null,
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
          statut: "en_cours",
          priorite: "haute",
          dateDebut: null,
          dateFin: endOfWeek(today, { locale: fr }),
          hideCompleted: true,
        };
        break;
      case "overdue":
        newFilters = {
          searchTerm: "",
          statut: "en_cours",
          priorite: null,
          dateDebut: null,
          dateFin: subDays(today, 1),
          hideCompleted: true,
        };
        break;
      case "today":
        newFilters = {
          searchTerm: "",
          statut: null,
          priorite: null,
          dateDebut: today,
          dateFin: today,
          hideCompleted: false,
        };
        break;
      case "thisWeek":
        newFilters = {
          searchTerm: "",
          statut: null,
          priorite: null,
          dateDebut: startOfWeek(today, { locale: fr }),
          dateFin: endOfWeek(today, { locale: fr }),
          hideCompleted: false,
        };
        break;
      case "completed":
        newFilters = {
          searchTerm: "",
          statut: "terminee",
          priorite: null,
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
    appliedFilters.statut !== null,
    appliedFilters.priorite !== null,
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
              value={pendingFilters.searchTerm}
              onChange={(e) => updatePendingFilter("searchTerm", e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-8"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-xs">Statut</Label>
          <Select
            value={pendingFilters.statut || "all"}
            onValueChange={(value) => updatePendingFilter("statut", value === "all" ? null : value)}
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
            value={pendingFilters.priorite || "all"}
            onValueChange={(value) => updatePendingFilter("priorite", value === "all" ? null : value)}
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
                {pendingFilters.dateDebut ? (
                  pendingFilters.dateFin ? (
                    <>
                      {format(pendingFilters.dateDebut, "dd/MM/yy")} - {format(pendingFilters.dateFin, "dd/MM/yy")}
                    </>
                  ) : (
                    format(pendingFilters.dateDebut, "dd/MM/yyyy")
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
                    selected={pendingFilters.dateDebut || undefined}
                    onSelect={(date) => updatePendingFilter("dateDebut", date || null)}
                    locale={fr}
                    className="pointer-events-auto"
                  />
                </div>
                {pendingFilters.dateDebut && (
                  <div className="space-y-1">
                    <Label className="text-xs">Date de fin (optionnel)</Label>
                    <Calendar
                      mode="single"
                      selected={pendingFilters.dateFin || undefined}
                      onSelect={(date) => updatePendingFilter("dateFin", date || null)}
                      locale={fr}
                      disabled={(date) => pendingFilters.dateDebut ? date < pendingFilters.dateDebut : false}
                      className="pointer-events-auto"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updatePendingFilter("dateDebut", null);
                      updatePendingFilter("dateFin", null);
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
      <div className="flex items-center justify-between pt-3 border-t gap-4 flex-wrap">
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
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={applyFilters}
            disabled={!hasUnappliedChanges}
            className="gap-1"
          >
            <Search className="h-3 w-3" />
            Rechercher
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
              <X className="h-3 w-3" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
