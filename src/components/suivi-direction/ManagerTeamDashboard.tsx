import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertCircle, ClipboardCheck, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getManagedEmployees,
  getOverdueTasksForManagedEmployees,
  getManagerDashboardStats,
  getCurrentEmployeeId,
  type ManagedEmployee,
  type OverdueTask,
  type ManagerDashboardStats,
} from "@/lib/managerUtils";

export const ManagerTeamDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [employees, setEmployees] = useState<ManagedEmployee[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [filterEquipe, setFilterEquipe] = useState<string>("all");
  const [equipes, setEquipes] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    const employeeId = await getCurrentEmployeeId(user.id);
    if (!employeeId) {
      setLoading(false);
      return;
    }

    setCurrentEmployeeId(employeeId);

    // Charger les stats
    const dashboardStats = await getManagerDashboardStats(employeeId);
    setStats(dashboardStats);

    // Charger les employés gérés
    const managedEmployees = await getManagedEmployees(employeeId);
    setEmployees(managedEmployees);

    // Extraire les équipes uniques
    const uniqueEquipes = [...new Set(managedEmployees.map((e) => e.equipe).filter(Boolean))];
    setEquipes(uniqueEquipes as string[]);

    // Charger les tâches en retard
    const tasks = await getOverdueTasksForManagedEmployees(employeeId);
    setOverdueTasks(tasks);

    setLoading(false);
  };

  const handleTaskClick = async (taskId: string) => {
    // Ouvrir la page de détails de la tâche dans un nouvel onglet
    window.open(`/taches?task=${taskId}`, '_blank');
  };

  const getRetardBadgeVariant = (jours: number) => {
    if (jours > 7) return "destructive";
    if (jours > 3) return "default";
    return "secondary";
  };

  const filteredTasks = overdueTasks.filter((task) => {
    if (filterEquipe === "all") return true;
    return task.employee_equipe === filterEquipe;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employés sous ma responsabilité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Tâches en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.total_overdue_tasks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Validations en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_validations || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Score moyen du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.average_score || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tâches en retard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Tâches en retard ({filteredTasks.length})
            </CardTitle>
            <Select value={filterEquipe} onValueChange={setFilterEquipe}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par équipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les équipes</SelectItem>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe} value={equipe}>
                    {equipe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              Aucune tâche en retard
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">
                        {task.employee_prenom} {task.employee_nom}
                      </Badge>
                      {task.employee_equipe && (
                        <Badge variant="secondary">{task.employee_equipe}</Badge>
                      )}
                    </div>
                    <h4 className="font-medium mb-1">{task.titre}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.date_echeance).toLocaleDateString("fr-FR")}
                      </div>
                      <Badge variant={getRetardBadgeVariant(task.jours_retard)}>
                        {task.jours_retard} jour{task.jours_retard > 1 ? "s" : ""} de retard
                      </Badge>
                    </div>
                    {task.priorite && (
                      <Badge
                        variant={
                          task.priorite === "haute"
                            ? "destructive"
                            : task.priorite === "moyenne"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {task.priorite}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mes employés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mes employés ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              Aucun employé assigné
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <div key={employee.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-1">
                    {employee.prenom} {employee.nom}
                  </h4>
                  {employee.poste && (
                    <p className="text-sm text-muted-foreground mb-2">{employee.poste}</p>
                  )}
                  {employee.equipe && (
                    <Badge variant="secondary" className="text-xs">
                      {employee.equipe}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
