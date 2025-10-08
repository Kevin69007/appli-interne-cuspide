import { useNavigate } from "react-router-dom";
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

  return (
    <Card 
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate("/objectifs-primes/employe")}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Mon Planning</h3>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement ce mois-ci</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-center gap-2 p-2 rounded border">
              <span className="text-xs font-medium">
                {format(new Date(event.date), "dd MMM", { locale: fr })}
              </span>
              <span className="text-sm text-muted-foreground">
                {event.detail || event.type}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Cliquez pour voir le calendrier complet
      </p>
    </Card>
  );
};
