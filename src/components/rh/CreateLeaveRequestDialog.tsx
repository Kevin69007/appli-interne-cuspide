import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CalendarIcon, Info } from "lucide-react";
import { format, differenceInBusinessDays, addDays, eachDayOfInterval, isSunday } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { fetchLeaveConfig, LeaveConfig } from "@/lib/leaveBalanceUtils";

interface CreateLeaveRequestDialogProps {
  employeeId: string;
  onSuccess?: () => void;
}

export const CreateLeaveRequestDialog = ({ employeeId, onSuccess }: CreateLeaveRequestDialogProps) => {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [motif, setMotif] = useState("");
  const [leaveConfig, setLeaveConfig] = useState<LeaveConfig | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await fetchLeaveConfig(employeeId);
      setLeaveConfig(config);
    };
    if (employeeId) {
      loadConfig();
    }
  }, [employeeId]);

  const dayType = leaveConfig?.day_type || 'ouvre';

  const calculateDays = (startDate: Date, endDate: Date) => {
    if (dayType === 'ouvre') {
      // Jours ouvrés (lundi-vendredi)
      return differenceInBusinessDays(addDays(endDate, 1), startDate) || 1;
    } else {
      // Jours ouvrables (lundi-samedi)
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      return allDays.filter(day => !isSunday(day)).length;
    }
  };

  const handleSubmit = async () => {
    if (!dateRange?.from) {
      toast.error("Veuillez sélectionner au moins une date");
      return;
    }

    setLoading(true);
    try {
      const startDate = dateRange.from;
      const endDate = dateRange.to || dateRange.from;
      
      // Calculate days based on config
      const workDays = calculateDays(startDate, endDate);
      const durationMinutes = workDays * 8 * 60;

      const detail = dateRange.to 
        ? `Du ${format(startDate, "dd/MM/yyyy")} au ${format(endDate, "dd/MM/yyyy")}${motif ? ` - ${motif}` : ""}`
        : `${format(startDate, "dd/MM/yyyy")}${motif ? ` - ${motif}` : ""}`;

      // Generate a unique group ID to link all entries of this request
      const requestGroupId = uuidv4();

      // Create an entry for EACH day of the period (all displayed as pending)
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const entriesToCreate = allDays.map((day, index) => ({
        employee_id: employeeId,
        date: format(day, "yyyy-MM-dd"),
        categorie: "absence" as const,
        type_absence: "demande_conges" as const,
        detail,
        duree_minutes: index === 0 ? durationMinutes : 0, // Duration only on first entry
        statut_validation: "en_attente" as const,
        points: 0,
        request_group_id: requestGroupId,
      }));

      const { error } = await supabase
        .from("agenda_entries")
        .insert(entriesToCreate);

      if (error) throw error;

      toast.success("Demande de congés envoyée");
      setOpen(false);
      setDateRange(undefined);
      setMotif("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating leave request:", error);
      toast.error("Erreur lors de la création de la demande");
    } finally {
      setLoading(false);
    }
  };

  const dayTypeLabel = dayType === 'ouvre' ? 'ouvrés' : 'ouvrables';
  const dayTypeDesc = dayType === 'ouvre' ? '(lun-ven)' : '(lun-sam)';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs sm:text-sm">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Nouvelle demande</span>
          <span className="sm:hidden">Demande</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-sm:p-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Demande de congés</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs sm:text-sm text-muted-foreground">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>
              Calcul en jours {dayTypeLabel} {dayTypeDesc}
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm">Dates *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs sm:text-sm h-9 sm:h-10",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: fr })
                    )
                  ) : (
                    "Sélectionner les dates"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={fr}
                  disabled={(date) => date < new Date()}
                  className="max-sm:scale-90 max-sm:origin-top-left"
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                {(() => {
                  const startDate = dateRange.from;
                  const endDate = dateRange.to || dateRange.from;
                  const days = calculateDays(startDate, endDate);
                  
                  return (
                    <p className="font-medium text-foreground">
                      {days} jour(s) {dayTypeLabel}
                      {dateRange.to && (
                        <span className="text-muted-foreground font-normal ml-1 text-[10px] sm:text-xs">
                          (du {format(startDate, "dd/MM")} au {format(endDate, "dd/MM")} inclus)
                        </span>
                      )}
                    </p>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="motif" className="text-sm">Motif (optionnel)</Label>
            <Textarea
              id="motif"
              placeholder="Ex: Vacances d'été, événement familial..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !dateRange?.from} className="w-full sm:w-auto">
            {loading ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
