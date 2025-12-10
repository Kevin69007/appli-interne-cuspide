import { useState, useEffect } from "react";
import { format, subDays, isWeekend, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
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
  const [todayDeclared, setTodayDeclared] = useState<boolean | null>(null);
  const [todayHours, setTodayHours] = useState<number | null>(null);
  const [missingDays, setMissingDays] = useState<MissingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

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
          formattedDate: format(new Date(date), 'EEEE d MMMM', { locale: fr })
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
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className={cn(
              "h-5 w-5",
              isAllGood ? "text-green-500" : "text-orange-500"
            )} />
            Déclaration de tes heures
            {hasMissingDays && (
              <Badge variant="destructive" className="ml-auto animate-pulse">
                {missingDays.length} retard{missingDays.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Today's status */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            todayDeclared 
              ? "bg-green-500/10 border border-green-500/20" 
              : "bg-orange-500/10 border border-orange-500/20"
          )}>
            <div className="flex items-center gap-2">
              {todayDeclared ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Aujourd'hui : <strong>{todayHours}h</strong> déclarées</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Aujourd'hui non déclaré</span>
                </>
              )}
            </div>
            {!todayDeclared && (
              <Button 
                size="sm" 
                onClick={() => handleDeclare()}
                className="bg-primary hover:bg-primary/90"
              >
                Déclarer
              </Button>
            )}
          </div>

          {/* Missing days */}
          {hasMissingDays && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                Retards à rattraper :
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {missingDays.slice(0, 5).map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-2 bg-destructive/5 rounded-md border border-destructive/10 hover:bg-destructive/10 transition-colors cursor-pointer group"
                    onClick={() => handleDeclare(day.date)}
                  >
                    <span className="text-xs capitalize">{day.formattedDate}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All good message */}
          {isAllGood && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="h-4 w-4" />
              <span>Tout est à jour !</span>
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
