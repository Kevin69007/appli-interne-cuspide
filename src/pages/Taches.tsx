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
  const [boomerangsSent, setBoomerangsSent] = useState<Task[]>([]);
  const [boomerangsReceived, setBoomerangsReceived] = useState<Task[]>([]);
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
      .maybeSingle();

    console.log("Employee data:", data, "Error:", error);
    if (!error && data) {
      setCurrentEmployeeId(data.id);
      console.log("Current employee ID set to:", data.id);
    } else {
      console.error("Failed to fetch employee:", error);
      toast.error("Vous devez être associé à un employé pour créer des tâches");
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
      // Mes tâches (assignées à moi, pas en mode boomerang actif)
      const { data: myTasks, error: myError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom)
        `)
        .eq("assigned_to", currentEmployeeId)
        .eq("boomerang_active", false)
        .neq("statut", "annulee")
        .order("date_echeance");

      if (myError) throw myError;

      // Boomerangs envoyés (je suis le propriétaire original)
      const { data: sentBoomerangs, error: sentError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom),
          boomerang_holder:employees!tasks_boomerang_current_holder_fkey(nom, prenom)
        `)
        .eq("boomerang_original_owner", currentEmployeeId)
        .eq("boomerang_active", true)
        .order("boomerang_deadline");

      if (sentError) throw sentError;

      // Boomerangs reçus (je suis le détenteur actuel)
      const { data: receivedBoomerangs, error: receivedError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom),
          creator_employee:employees!tasks_created_by_fkey(nom, prenom),
          boomerang_owner:employees!tasks_boomerang_original_owner_fkey(nom, prenom)
        `)
        .eq("boomerang_current_holder", currentEmployeeId)
        .eq("boomerang_active", true)
        .order("boomerang_deadline");

      if (receivedError) throw receivedError;

      setTasks(myTasks || []);
      setBoomerangsSent(sentBoomerangs || []);
      setBoomerangsReceived(receivedBoomerangs || []);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-tasks">
              Mes tâches ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="boomerangs-sent">
              🪃 Envoyés ({boomerangsSent.length})
            </TabsTrigger>
            <TabsTrigger value="boomerangs-received">
              🪃 Reçus ({boomerangsReceived.length})
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

          <TabsContent value="boomerangs-sent" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : boomerangsSent.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun boomerang envoyé</p>
            ) : (
              boomerangsSent.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="boomerangs-received" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : boomerangsReceived.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun boomerang reçu</p>
            ) : (
              boomerangsReceived.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={fetchTasks}
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
        canAssignOthers={true}
      />
    </div>
  );
};

export default Taches;
