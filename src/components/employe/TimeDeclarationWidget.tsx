import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format, subDays, isWeekend } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Clock, AlertTriangle, Check, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEmployee } from "@/contexts/EmployeeContext";
import { TimeDeclarationQuickDialog } from "./TimeDeclarationQuickDialog";
import { cn } from "@/lib/utils";

interface MissingDay {
  date: string;
  formattedDate: string;
}

export const TimeDeclarationWidget = () => {
  const { employee } = useEmployee();
  const { t, i18n } = useTranslation();
  const [todayDeclared, setTodayDeclared] = useState<boolean | null>(null);
  const [todayHours, setTodayHours] = useState<number | null>(null);
  const [missingDays, setMissingDays] = useState<MissingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const dateLocale = i18n.language === 'fr' ? fr : enUS;

  useEffect(() => {
    if (!employee?.id) return;
    fetchDeclarationStatus();
  }, [employee?.id]);

  const fetchDeclarationStatus = async () => {
    if (!employee?.id) return;
    setLoading(true);

    try {
      // Check today's declaration
      const { data: todayData } = await supabase
        .from('pointage')
        .select('heures')
        .eq('employee_id', employee.id)
        .eq('date', today)
        .maybeSingle();

      setTodayDeclared(!!todayData);
      setTodayHours(todayData?.heures ?? null);

      // Get last 7 workdays to check for missing declarations
      const workDays: string[] = [];
      let checkDate = subDays(new Date(), 1); // Start from yesterday
      
      while (workDays.length < 5) {
        if (!isWeekend(checkDate)) {
          workDays.push(format(checkDate, 'yyyy-MM-dd'));
        }
        checkDate = subDays(checkDate, 1);
      }

      // Fetch existing declarations for these days
      const { data: existingDeclarations } = await supabase
        .from('pointage')
        .select('date')
        .eq('employee_id', employee.id)
        .in('date', workDays);

      const declaredDates = new Set(existingDeclarations?.map(d => d.date) || []);
      
      const missing = workDays
        .filter(date => !declaredDates.has(date))
        .map(date => ({
          date,
          formattedDate: format(new Date(date), 'EEEE d MMMM', { locale: dateLocale })
        }));

      setMissingDays(missing);
    } catch (error) {
      console.error('Error fetching declaration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclare = (date?: string) => {
    setSelectedDate(date || today);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setSelectedDate(null);
    fetchDeclarationStatus();
  };

  // Don't show if not remote employee
  if (!employee?.is_remote) return null;

  if (loading) {
    return (
      <Card className="glass animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 w-40 bg-muted/50 rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted/50 rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasMissingDays = missingDays.length > 0;
  const isAllGood = todayDeclared && !hasMissingDays;

  return (
    <>
      <Card className={cn(
        "glass transition-all duration-300",
        !todayDeclared && "border-2 border-orange-500/50 shadow-orange-500/20 shadow-lg",
        hasMissingDays && "border-2 border-destructive/50 shadow-destructive/20 shadow-lg animate-pulse-glow"
      )}>
        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Clock className={cn(
              "h-4 w-4 sm:h-5 sm:w-5",
              isAllGood ? "text-green-500" : "text-orange-500"
            )} />
            <span className="truncate">{t('timeDeclaration.title')}</span>
            {hasMissingDays && (
              <Badge variant="destructive" className="ml-auto animate-pulse text-[10px] sm:text-xs">
                {missingDays.length} {missingDays.length > 1 ? t('timeDeclaration.delays') : t('timeDeclaration.delay')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
          {/* Today's status */}
          <div className={cn(
            "flex items-center justify-between p-2 sm:p-3 rounded-lg gap-2",
            todayDeclared 
              ? "bg-green-500/10 border border-green-500/20" 
              : "bg-orange-500/10 border border-orange-500/20"
          )}>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {todayDeclared ? (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{t('timeDeclaration.today')} : <strong>{todayHours}h</strong></span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium truncate">{t('timeDeclaration.notDeclared')}</span>
                </>
              )}
            </div>
            {!todayDeclared && (
              <Button 
                size="sm" 
                onClick={() => handleDeclare()}
                className="bg-primary hover:bg-primary/90 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 shrink-0"
              >
                {t('timeDeclaration.declare')}
              </Button>
            )}
          </div>

          {/* Missing days */}
          {hasMissingDays && (
            <div className="space-y-1.5 sm:space-y-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-destructive" />
                {t('timeDeclaration.delaysToMakeUp')}
              </p>
              <div className="space-y-1 sm:space-y-1.5 max-h-24 sm:max-h-32 overflow-y-auto">
                {missingDays.slice(0, 5).map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-1.5 sm:p-2 bg-destructive/5 rounded-md border border-destructive/10 hover:bg-destructive/10 transition-colors cursor-pointer group min-h-[36px] sm:min-h-[auto]"
                    onClick={() => handleDeclare(day.date)}
                  >
                    <span className="text-[10px] sm:text-xs capitalize truncate">{day.formattedDate}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All good message */}
          {isAllGood && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 text-xs sm:text-sm">
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t('timeDeclaration.allUpToDate')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <TimeDeclarationQuickDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate || today}
        onSuccess={handleSuccess}
      />
    </>
  );
};
