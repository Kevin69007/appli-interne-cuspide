import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Book } from "lucide-react";
import { CreateTaskDialog } from "@/components/taches/CreateTaskDialog";
import { TaskCard } from "@/components/taches/TaskCard";
import { MaintenanceLogDialog } from "@/components/taches/MaintenanceLogDialog";
import { toast } from "sonner";

interface Task {
  id: string;
  titre: string;
  description: string;
  date_echeance: string;
  statut: string;
  priorite: string;
  created_by: string;
  assigned_to: string;
  depend_de: string | null;
  parent_task_id: string | null;
  recurrence: any;
  commentaires: any;
  rappels: any;
  created_at: string;
  updated_at: string;
  machine_piece: string | null;
  maintenance_type: string | null;
  photos: string[];
  assigned_employee?: { nom: string; prenom: string };
  creator_employee?: { nom: string; prenom: string };
  dependency_employee?: { nom: string; prenom: string };
}

const EntretiensMachines = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCurrentEmployee();
  }, [user, navigate]);

  useEffect(() => {
    if (currentEmployeeId) {
      fetchMaintenanceTasks();
    }
  }, [currentEmployeeId]);

  const fetchCurrentEmployee = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom, user_id")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (!error && data) {
      setCurrentEmployeeId(data.id);
    } else {
      toast.error("Vous devez être associé à un employé");
    }
  };

  const fetchMaintenanceTasks = async () => {
    if (!currentEmployeeId) return;

    setLoading(true);
    try {
      const { data: maintenanceTasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom),
          dependency_employee:employees!tasks_depend_de_fkey(nom, prenom)
        `)
        .not("maintenance_type", "is", null)
        .neq("statut", "annulee")
        .order("date_echeance");

      if (error) throw error;
      setTasks(maintenanceTasks || []);
    } catch (error) {
      console.error("Error fetching maintenance tasks:", error);
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Entretiens Locaux et Machines</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLogDialog(true)}>
              <Book className="h-4 w-4 mr-2" />
              Journal d'entretien
            </Button>
            {(isAdmin || isManager) && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche d'entretien
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="machines" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="machines">
              Machines ({tasks.filter(t => t.maintenance_type === "machine").length})
            </TabsTrigger>
            <TabsTrigger value="pieces">
              Pièces/Locaux ({tasks.filter(t => t.maintenance_type === "piece").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="machines" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : tasks.filter(t => t.maintenance_type === "machine").length === 0 ? (
              <p className="text-center text-muted-foreground">Aucune tâche d'entretien de machine</p>
            ) : (
              tasks.filter(t => t.maintenance_type === "machine").map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchMaintenanceTasks}
                  isMaintenance
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pieces" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : tasks.filter(t => t.maintenance_type === "piece").length === 0 ? (
              <p className="text-center text-muted-foreground">Aucune tâche d'entretien de pièce/local</p>
            ) : (
              tasks.filter(t => t.maintenance_type === "piece").map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchMaintenanceTasks}
                  isMaintenance
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentEmployeeId={currentEmployeeId}
        onTaskCreated={fetchMaintenanceTasks}
        canAssignOthers={true}
        isMaintenance
      />

      <MaintenanceLogDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
      />
    </div>
  );
};

export default EntretiensMachines;