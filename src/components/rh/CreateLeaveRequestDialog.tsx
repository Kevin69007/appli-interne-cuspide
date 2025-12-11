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
import { fr, enUS } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { fetchLeaveConfig, LeaveConfig } from "@/lib/leaveBalanceUtils";

interface CreateLeaveRequestDialogProps {
  employeeId: string;
  onSuccess?: () => void;
}

export const CreateLeaveRequestDialog = ({ employeeId, onSuccess }: CreateLeaveRequestDialogProps) => {
  const { t, i18n } = useTranslation("rh");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [motif, setMotif] = useState("");
  const [leaveConfig, setLeaveConfig] = useState<LeaveConfig | null>(null);

  const dateLocale = i18n.language === 'fr' ? fr : enUS;

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
      toast.error(t("createLeaveRequest.selectDateError"));
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
        ? `${t("createLeaveRequest.from")} ${format(startDate, "dd/MM/yyyy")} ${t("createLeaveRequest.to")} ${format(endDate, "dd/MM/yyyy")}${motif ? ` - ${motif}` : ""}`
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

      toast.success(t("createLeaveRequest.requestSent"));
      setOpen(false);
      setDateRange(undefined);
      setMotif("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating leave request:", error);
      toast.error(t("createLeaveRequest.errorCreating"));
    } finally {
      setLoading(false);
    }
  };

  const dayTypeLabel = dayType === 'ouvre' ? t("leaveBalance.workingDays") : t("leaveBalance.businessDays");
  const dayTypeDesc = dayType === 'ouvre' 
    ? (i18n.language === 'fr' ? '(lun-ven)' : '(Mon-Fri)') 
    : (i18n.language === 'fr' ? '(lun-sam)' : '(Mon-Sat)');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs sm:text-sm">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">{t("createLeaveRequest.newRequest")}</span>
          <span className="sm:hidden">{t("createLeaveRequest.request")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-sm:p-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t("createLeaveRequest.title")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs sm:text-sm text-muted-foreground">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>
              {t("createLeaveRequest.calculationInfo")} {dayTypeLabel} {dayTypeDesc}
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm">{t("createLeaveRequest.dates")} *</Label>
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
                        {format(dateRange.from, "dd MMM yyyy", { locale: dateLocale })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: dateLocale })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: dateLocale })
                    )
                  ) : (
                    t("createLeaveRequest.selectDates")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={dateLocale}
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
                      {days} {t("createLeaveRequest.day")} {dayTypeLabel}
                      {dateRange.to && (
                        <span className="text-muted-foreground font-normal ml-1 text-[10px] sm:text-xs">
                          ({t("createLeaveRequest.from")} {format(startDate, "dd/MM")} {t("createLeaveRequest.to")} {format(endDate, "dd/MM")} {t("createLeaveRequest.inclusive")})
                        </span>
                      )}
                    </p>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="motif" className="text-sm">{t("createLeaveRequest.motif")}</Label>
            <Textarea
              id="motif"
              placeholder={t("createLeaveRequest.motifPlaceholder")}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            {t("createLeaveRequest.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !dateRange?.from} className="w-full sm:w-auto">
            {loading ? t("createLeaveRequest.sending") : t("createLeaveRequest.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
