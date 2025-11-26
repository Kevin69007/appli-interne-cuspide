import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { CheckSquare, ChevronRight, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Task {
  id: string;
  titre: string;
  date_echeance: string;
  priorite: string;
  statut: string;
}

export const TachesWidget = ({ onDataLoaded }: { onDataLoaded?: (hasData: boolean) => void } = {}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('indicators');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserTasks();
  }, []);

  const fetchUserTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;

      const today = format(new Date(), "yyyy-MM-dd");

      const { data } = await supabase
        .from("tasks")
        .select("id, titre, date_echeance, priorite, statut")
        .eq("assigned_to", employee.id)
        .in("statut", ["en_cours", "a_faire"])
        .lte("date_echeance", today)
        .order("date_echeance", { ascending: true })
        .limit(5);

      setTasks(data || []);
      onDataLoaded?.((data || []).length > 0);
    } catch (error) {
      console.error("Erreur:", error);
      onDataLoaded?.(false);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (date: string) => {
    const taskDate = new Date(date);
    return isPast(taskDate) && !isToday(taskDate);
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "terminee" ? "en_cours" : "terminee";
    
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ statut: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      toast.success(newStatus === "terminee" ? t('employee.tasks.taskCompleted') : t('employee.tasks.taskReactivated'));
      fetchUserTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(t('employee.tasks.updateError'));
    }
  };

  if (loading) {
    return null;
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card 
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate("/taches")}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('employee.tasks.myTasks')}</h3>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2 p-2 rounded border">
              <Checkbox
                checked={task.statut === "terminee"}
                onCheckedChange={() => toggleTaskStatus(task.id, task.statut)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${task.statut === "terminee" ? "line-through text-muted-foreground" : ""}`}>
                  {task.titre}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(task.date_echeance), "dd MMM", { locale: fr })}
                </p>
              </div>
              {isOverdue(task.date_echeance) && task.statut !== "terminee" && (
                <Badge variant="destructive" className="ml-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('employee.tasks.overdue')}
                </Badge>
              )}
            </div>
          ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        {t('employee.tasks.clickToViewAll')}
      </p>
    </Card>
  );
};
