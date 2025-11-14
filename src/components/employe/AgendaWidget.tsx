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
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate("/agenda")}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('employee.agenda.title')}</h3>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="mb-4">
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-3xl font-bold text-primary">
            {format(today, "dd", { locale: fr })}
          </div>
          <div className="text-sm text-muted-foreground uppercase">
            {format(today, "MMMM yyyy", { locale: fr })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('employee.agenda.loading')}</p>
        ) : todayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t('employee.agenda.noEvents')}
          </p>
        ) : (
          todayEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {event.detail || event.type}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        {t('employee.agenda.viewFullCalendar')}
      </p>
    </Card>
  );
};
