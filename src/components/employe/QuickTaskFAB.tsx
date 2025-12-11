import { useState } from "react";
import { Plus, X, Calendar, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useEmployee } from "@/contexts/EmployeeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const QuickTaskFAB = () => {
  const { t } = useTranslation("tasks");
  const { employee } = useEmployee();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<string>("normale");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(t("errors.titleRequired"));
      return;
    }

    if (!employee?.id) {
      toast.error(t("errors.noEmployee"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("tasks").insert({
        titre: title.trim(),
        date_echeance: dueDate ? format(dueDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        priorite: priority,
        statut: "a_faire",
        assigned_to: employee.id,
        created_by: employee.id,
        validation_responsable_id: employee.id,
      });

      if (error) throw error;

      toast.success(t("create.success"));
      setTitle("");
      setDueDate(undefined);
      setPriority("normale");
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(t("errors.createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTitle("");
    setDueDate(undefined);
    setPriority("normale");
  };

  return (
    <>
      {/* Backdrop when form is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={handleClose}
        />
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          "hover:shadow-xl hover:shadow-primary/30 hover:scale-105",
          "active:scale-95",
          // Mobile positioning
          "bottom-20 right-4 w-14 h-14",
          // Desktop positioning
          "sm:bottom-8 sm:right-8 sm:w-16 sm:h-16",
          isOpen && "rotate-45"
        )}
        aria-label={isOpen ? t("create.close") : t("create.quickTask")}
      >
        {isOpen ? (
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        ) : (
          <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
        )}
      </button>

      {/* Quick Task Form */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 glass rounded-xl shadow-2xl border border-border/50 p-4 animate-fade-in-up",
          // Mobile: full width near bottom
          "bottom-36 left-4 right-4",
          // Desktop: fixed width on right
          "sm:bottom-28 sm:left-auto sm:right-8 sm:w-80"
        )}>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            {t("create.quickTask")}
          </h3>

          <div className="space-y-3">
            {/* Title */}
            <div>
              <Label htmlFor="quick-title" className="text-xs text-muted-foreground">
                {t("taskTitle")} *
              </Label>
              <Input
                id="quick-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("create.titlePlaceholder")}
                className="h-10 mt-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            {/* Due Date */}
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("dueDate")}
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 mt-1",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "d MMM yyyy", { locale: fr }) : t("create.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("priority")}
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="haute">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-destructive" />
                      {t("priorityHigh")}
                    </span>
                  </SelectItem>
                  <SelectItem value="normale">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-warning" />
                      {t("priorityNormal")}
                    </span>
                  </SelectItem>
                  <SelectItem value="basse">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-muted-foreground" />
                      {t("priorityLow")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:shadow-lg"
            >
              {isSubmitting ? t("create.creating") : t("createTask")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
