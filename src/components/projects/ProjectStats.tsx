import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";

interface ProjectStatsProps {
  projectId: string;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  onTimeTasks: number;
  totalMeetings: number;
  averageCompletionDays: number;
}

export const ProjectStats = ({ projectId }: ProjectStatsProps) => {
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    onTimeTasks: 0,
    totalMeetings: 0,
    averageCompletionDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [projectId]);

  const fetchStats = async () => {
    try {
      // Fetch tasks for this project
      const { data: projectTasks, error: tasksError } = await supabase
        .from("project_tasks")
        .select(`
          task:tasks(
            id,
            statut,
            date_echeance,
            created_at,
            updated_at
          )
        `)
        .eq("project_id", projectId);

      if (tasksError) throw tasksError;

      const tasks = projectTasks?.map((pt) => pt.task).filter(Boolean) || [];

      // Calculate stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.statut === "terminee").length;
      const inProgressTasks = tasks.filter((t) => t.statut === "en_cours").length;
      
      const now = new Date();
      const overdueTasks = tasks.filter(
        (t) => t.date_echeance && new Date(t.date_echeance) < now && t.statut !== "terminee"
      ).length;

      const onTimeTasks = tasks.filter(
        (t) => t.statut === "terminee" && 
        t.updated_at && 
        t.date_echeance && 
        new Date(t.updated_at) <= new Date(t.date_echeance)
      ).length;

      // Calculate average completion time
      const completedWithDates = tasks.filter(
        (t) => t.statut === "terminee" && t.created_at && t.updated_at
      );
      
      let averageCompletionDays = 0;
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, task) => {
          const start = new Date(task.created_at!);
          const end = new Date(task.updated_at!);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        averageCompletionDays = Math.round(totalDays / completedWithDates.length);
      }

      // Fetch meetings count
      const { count: meetingsCount } = await supabase
        .from("project_meetings")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      setStats({
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        onTimeTasks,
        totalMeetings: meetingsCount || 0,
        averageCompletionDays,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = stats.totalTasks > 0 
    ? (stats.completedTasks / stats.totalTasks) * 100 
    : 0;

  const onTimeRate = stats.completedTasks > 0
    ? (stats.onTimeTasks / stats.completedTasks) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Main stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tâches totales</p>
              <p className="text-3xl font-bold">{stats.totalTasks}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
          </div>
          <Progress value={completionRate} className="mt-4" />
          <p className="text-xs text-muted-foreground mt-2">
            {completionRate.toFixed(1)}% complétées
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-3xl font-bold">{stats.inProgressTasks}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <Badge className="mt-4" variant="outline">
            {stats.totalTasks > 0 
              ? `${((stats.inProgressTasks / stats.totalTasks) * 100).toFixed(1)}% du total`
              : "0%"}
          </Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En retard</p>
              <p className="text-3xl font-bold">{stats.overdueTasks}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          {stats.overdueTasks > 0 && (
            <Badge className="mt-4 bg-red-500/10 text-red-500 border-red-500/20">
              Attention requise
            </Badge>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Livrées à temps</p>
              <p className="text-3xl font-bold">{stats.onTimeTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <Progress value={onTimeRate} className="mt-4" />
          <p className="text-xs text-muted-foreground mt-2">
            {onTimeRate.toFixed(1)}% dans les délais
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Réunions</p>
              <p className="text-3xl font-bold">{stats.totalMeetings}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Durée moyenne</p>
              <p className="text-3xl font-bold">{stats.averageCompletionDays}</p>
              <p className="text-xs text-muted-foreground">jours</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
