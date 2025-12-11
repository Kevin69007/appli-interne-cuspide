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
import { 
  Search, Calendar as CalendarIcon, X, Flame, Clock, Target, 
  Calendar as CalendarCheck, CheckCircle2, AlertCircle, Filter, ChevronDown, ChevronUp 
} from "lucide-react";
import { format, startOfWeek, endOfWeek, subDays, startOfToday } from "date-fns";
import { fr, enUS } from "date-fns/locale";
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

export const TaskFilters = ({ onFilterChange, taskCount }: TaskFiltersProps) => {
  const { t, i18n } = useTranslation('tasks');
  const dateLocale = i18n.language === 'fr' ? fr : enUS;

  const statusOptions = [
    { value: "en_cours", label: `🟢 ${t('filters.statusOptions.inProgress')}` },
    { value: "terminee", label: `✅ ${t('filters.statusOptions.completed')}` },
    { value: "a_venir", label: `🔵 ${t('filters.statusOptions.upcoming')}` },
    { value: "en_attente_validation", label: `⏳ ${t('filters.statusOptions.awaitingValidation')}` },
  ];

  const priorityOptions = [
    { value: "haute", label: `🔴 ${t('filters.priorityOptions.high')}` },
    { value: "normale", label: `🔵 ${t('filters.priorityOptions.normal')}` },
    { value: "basse", label: `🟢 ${t('filters.priorityOptions.low')}` },
  ];

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
  const [isExpanded, setIsExpanded] = useState(false);

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
          dateFin: endOfWeek(today, { locale: dateLocale }),
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
          dateDebut: startOfWeek(today, { locale: dateLocale }),
          dateFin: endOfWeek(today, { locale: dateLocale }),
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
      {/* Mobile: Collapsible Header */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full py-2"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium text-sm">{t('filters.title')}</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {taskCount.filtered}/{taskCount.total}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>
      </div>

      {/* Quick Filter Presets - Always visible */}
      <div className={cn(
        "flex overflow-x-auto gap-2 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-thin",
        isExpanded || "md:flex" ? "flex" : "hidden md:flex",
        "md:mb-4"
      )}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("urgent")}
          className="text-xs shrink-0 h-8"
        >
          <Flame className="h-3 w-3 mr-1" />
          <span>{t('filters.presets.urgent')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("overdue")}
          className="text-xs shrink-0 h-8"
        >
          <Clock className="h-3 w-3 mr-1" />
          <span>{t('filters.presets.overdue')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("today")}
          className="text-xs shrink-0 h-8"
        >
          <Target className="h-3 w-3 mr-1" />
          <span>{t('filters.presets.today')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("thisWeek")}
          className="text-xs shrink-0 h-8"
        >
          <CalendarCheck className="h-3 w-3 mr-1" />
          <span>{t('filters.presets.week')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset("completed")}
          className="text-xs shrink-0 h-8"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          <span>{t('filters.presets.recentlyCompleted')}</span>
        </Button>
      </div>

      {/* Main Filters - Collapsible on mobile */}
      <div className={cn(
        "space-y-3 md:space-y-4",
        isExpanded ? "block" : "hidden md:block"
      )}>
        {/* Search - Full width on mobile */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs">{t('filters.search')}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder={t('filters.searchPlaceholder')}
              value={pendingFilters.searchTerm}
              onChange={(e) => updatePendingFilter("searchTerm", e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-8 h-10"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Status - MultiSelect */}
          <div className="space-y-2">
            <Label className="text-xs">{t('filters.status')}</Label>
            <MultiSelect
              selectedValues={pendingFilters.statut}
              onSelectedValuesChange={(values) => updatePendingFilter("statut", values)}
              options={statusOptions}
              placeholder={t('filters.allStatuses')}
              searchPlaceholder={t('filters.search') + '...'}
            />
          </div>

          {/* Priority - MultiSelect */}
          <div className="space-y-2">
            <Label className="text-xs">{t('filters.priority')}</Label>
            <MultiSelect
              selectedValues={pendingFilters.priorite}
              onSelectedValuesChange={(values) => updatePendingFilter("priorite", values)}
              options={priorityOptions}
              placeholder={t('filters.allPriorities')}
              searchPlaceholder={t('filters.search') + '...'}
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label className="text-xs">{t('filters.dueDate')}</Label>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {pendingFilters.dateDebut ? (
                      pendingFilters.dateFin ? (
                        <>
                          {format(pendingFilters.dateDebut, "dd/MM/yy")} - {format(pendingFilters.dateFin, "dd/MM/yy")}
                        </>
                      ) : (
                        format(pendingFilters.dateDebut, "dd/MM/yyyy")
                      )
                    ) : (
                      <span className="text-muted-foreground">{t('filters.allDates')}</span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    locale={dateLocale}
                    numberOfMonths={1}
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
                      className="flex-1"
                    >
                      {t('filters.clear')}
                    </Button>
                    <Button size="sm" onClick={() => setShowDatePicker(false)} className="flex-1">
                      {t('filters.ok')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Hide Completed Checkbox */}
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="hideCompleted"
            checked={pendingFilters.hideCompleted}
            onCheckedChange={(checked) => updatePendingFilter("hideCompleted", checked)}
          />
          <label
            htmlFor="hideCompleted"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {t('filters.hideCompleted')}
          </label>
        </div>

        {/* Warning for unapplied changes */}
        {hasUnappliedChanges && (
          <div className="flex items-center gap-2 p-2 sm:p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">
              {t('filters.clickToApply')}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t gap-3">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                🔍 {activeFilterCount} {activeFilterCount > 1 ? t('filters.activeFiltersPlural') : t('filters.activeFilters')}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {taskCount.filtered} / {taskCount.total} {taskCount.total > 1 ? t('filters.taskCountPlural') : t('filters.taskCount')}
            </span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={applyFilters}
              disabled={!hasUnappliedChanges}
              className="gap-1 flex-1 sm:flex-none h-10 sm:h-8"
            >
              <Search className="h-4 w-4 sm:h-3 sm:w-3" />
              {t('filters.applyFilters')}
            </Button>
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters} 
                className="gap-1 flex-1 sm:flex-none h-10 sm:h-8"
              >
                <X className="h-4 w-4 sm:h-3 sm:w-3" />
                {t('filters.reset')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
