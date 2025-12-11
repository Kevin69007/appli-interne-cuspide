import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Info, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Communication {
  id: string;
  titre: string;
  contenu: string;
  require_confirmation: boolean;
  show_in_calendar: boolean;
  created_at: string;
  isRead: boolean;
}

export const InfosImportantesWidget = ({ onDataLoaded }: { onDataLoaded?: (hasData: boolean) => void } = {}) => {
  const { t } = useTranslation('indicators');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;
      setEmployeeId(employee.id);

      // Récupérer les communications
      const { data: comms } = await supabase
        .from("communications")
        .select("*")
        .eq("is_active", true)
        .or(`date_expiration.is.null,date_expiration.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (!comms) return;

      // Vérifier les lectures
      const { data: lectures } = await supabase
        .from("communication_lectures")
        .select("communication_id")
        .eq("employee_id", employee.id);

      const readIds = new Set(lectures?.map(l => l.communication_id) || []);

      const enrichedComms = comms.map(comm => ({
        ...comm,
        isRead: readIds.has(comm.id)
      })).filter(comm => !comm.require_confirmation || !comm.isRead);

      setCommunications(enrichedComms);
      onDataLoaded?.(enrichedComms.length > 0);
    } catch (error) {
      console.error("Erreur:", error);
      onDataLoaded?.(false);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (commId: string) => {
    if (!employeeId) return;

    try {
      await supabase
        .from("communication_lectures")
        .insert({
          communication_id: commId,
          employee_id: employeeId
        });

      toast({
        title: t('employee.importantInfoWidget.markedAsRead'),
        description: t('employee.importantInfoWidget.readDescription')
      });

      fetchCommunications();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: t('employee.importantInfoWidget.error'),
        description: t('employee.importantInfoWidget.markAsReadError'),
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return null;
  }

  if (communications.length === 0) {
    return null;
  }

  return (
    <Card variant="glass" className="p-3 sm:p-6 animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <h3 className="text-sm sm:text-lg font-display font-semibold flex-1 truncate">{t('employee.importantInfoWidget.title')}</h3>
        {communications.length > 0 && (
          <Badge variant="destructive" className="animate-pulse text-xs">{communications.length}</Badge>
        )}
      </div>

      <div className="space-y-2 sm:space-y-4">
        {communications.map((comm, idx) => (
          <div 
            key={comm.id} 
            className="p-2.5 sm:p-4 glass border border-border/50 rounded-lg space-y-1.5 sm:space-y-2 hover:border-primary/50 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-xs sm:text-base line-clamp-2">{comm.titre}</h4>
                {comm.require_confirmation && !comm.isRead && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">{t('employee.importantInfoWidget.toConfirm')}</Badge>
                )}
              </div>
              
              <p className="text-[11px] sm:text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 sm:line-clamp-none">
                {comm.contenu}
              </p>

              {comm.require_confirmation && !comm.isRead && (
                <Button 
                  size="sm" 
                  onClick={() => markAsRead(comm.id)}
                  className="w-full mt-1.5 sm:mt-2 h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {t('employee.importantInfoWidget.markAsRead')}
                </Button>
              )}
            </div>
          ))}
      </div>
    </Card>
  );
};
