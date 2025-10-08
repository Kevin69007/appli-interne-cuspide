import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft } from "lucide-react";
import { CreateTaskDialog } from "@/components/taches/CreateTaskDialog";
import { TaskCard } from "@/components/taches/TaskCard";
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
  assigned_employee?: { nom: string; prenom: string };
  creator_employee?: { nom: string; prenom: string };
  dependency_employee?: { nom: string; prenom: string };
}

const Taches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [helpTasks, setHelpTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
      fetchTasks();
    }
  }, [currentEmployeeId]);

  const fetchCurrentEmployee = async () => {
    console.log("Fetching employee for user_id:", user?.id);
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom, user_id")
      .eq("user_id", user?.id)
      .single();

    console.log("Employee data:", data, "Error:", error);
    if (!error && data) {
      setCurrentEmployeeId(data.id);
      console.log("Current employee ID set to:", data.id);
    } else {
      console.error("Failed to fetch employee:", error);
    }
  };

  const fetchTasks = async () => {
    if (!currentEmployeeId) {
      console.log("No currentEmployeeId, skipping task fetch");
      return;
    }

    console.log("Fetching tasks for employee ID:", currentEmployeeId);
    setLoading(true);
    try {
      // Mes tâches
      const { data: myTasks, error: myError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom),
          dependency_employee:employees!tasks_depend_de_fkey(nom, prenom)
        `)
        .eq("assigned_to", currentEmployeeId)
        .neq("statut", "annulee")
        .order("date_echeance");

      console.log("My tasks query result:", myTasks, "Error:", myError);
      if (myError) throw myError;

      // Tâches où je suis en dépendance
      const { data: dependencyTasks, error: depError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom),
          dependency_employee:employees!tasks_depend_de_fkey(nom, prenom)
        `)
        .eq("depend_de", currentEmployeeId)
        .neq("statut", "annulee")
        .order("date_echeance");

      if (depError) throw depError;

      setTasks(myTasks || []);
      setHelpTasks(dependencyTasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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
            <h1 className="text-3xl font-bold">Mes Tâches</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        <Tabs defaultValue="my-tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-tasks">
              Mes tâches ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="help-requests">
              Aide demandée par collègue ({helpTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : tasks.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucune tâche pour le moment</p>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="help-requests" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : helpTasks.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucune demande d'aide</p>
            ) : (
              helpTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
                  isHelpRequest
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
        onTaskCreated={fetchTasks}
        canAssignOthers={isAdmin || isManager}
      />
    </div>
  );
};

export default Taches;
