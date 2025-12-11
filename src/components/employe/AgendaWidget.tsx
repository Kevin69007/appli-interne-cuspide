import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

interface AgendaEvent {
  id: string;
  date: string;
  type: string;
  detail?: string;
}

export const AgendaWidget = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('indicators');
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;

      const today = new Date();
      const start = startOfMonth(today);
      const end = endOfMonth(today);

      const { data } = await supabase
        .from("agenda_entries")
        .select("id, date, type, detail")
        .eq("employee_id", employee.id)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"))
        .order("date", { ascending: true })
        .limit(5);

      setEvents(data || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const todayEvents = events.filter(e => 
    format(new Date(e.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
  );

  return (
    <Card 
      variant="glass"
      className="p-3 sm:p-6 cursor-pointer hover-3d transition-all duration-300 animate-fade-in group"
      onClick={() => navigate("/agenda")}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h3 className="text-sm sm:text-lg font-display font-semibold">{t('employee.agenda.title')}</h3>
        </div>
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="relative text-center p-4 sm:p-6 glass rounded-xl border border-primary/30 overflow-hidden group-hover:border-primary/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="text-3xl sm:text-5xl font-display font-bold text-primary mb-1 sm:mb-2 animate-scale-in">
              {format(today, "dd", { locale: fr })}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
              {format(today, "MMMM yyyy", { locale: fr })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {loading ? (
          <p className="text-xs sm:text-sm text-muted-foreground">{t('employee.agenda.loading')}</p>
        ) : todayEvents.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">
            {t('employee.agenda.noEvents')}
          </p>
        ) : (
          todayEvents.map((event, idx) => (
            <div 
              key={event.id} 
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {event.detail || event.type}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] sm:text-xs text-muted-foreground mt-3 sm:mt-4 text-center">
        {t('employee.agenda.viewFullCalendar')}
      </p>
    </Card>
  );
};
