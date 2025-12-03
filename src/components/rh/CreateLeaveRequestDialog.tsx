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

      const { error } = await supabase
        .from("agenda_entries")
        .insert({
          employee_id: employeeId,
          date: format(startDate, "yyyy-MM-dd"),
          categorie: "absence",
          type_absence: "demande_conges",
          detail,
          duree_minutes: durationMinutes,
          statut_validation: "en_attente",
          points: 0,
        });

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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Demande de congés</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Calcul en jours {dayTypeLabel} {dayTypeDesc}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Dates *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
                  numberOfMonths={2}
                  locale={fr}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const startDate = dateRange.from;
                  const endDate = dateRange.to || dateRange.from;
                  const days = calculateDays(startDate, endDate);
                  
                  return (
                    <p className="font-medium text-foreground">
                      {days} jour(s) {dayTypeLabel}
                    </p>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif (optionnel)</Label>
            <Textarea
              id="motif"
              placeholder="Ex: Vacances d'été, événement familial..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !dateRange?.from}>
            {loading ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
