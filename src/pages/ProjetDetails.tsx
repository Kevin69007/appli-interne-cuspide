import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, User, AlertCircle, Plus, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { TaskCard } from "@/components/taches/TaskCard";
import { CreateTaskDialog } from "@/components/taches/CreateTaskDialog";
import { LinkTaskToProjectDialog } from "@/components/projects/LinkTaskToProjectDialog";

interface Project {
  id: string;
  titre: string;
  description: string;
  statut: string;
  date_echeance: string;
  progression: number;
  is_priority: boolean;
  responsable_id: string;
  created_at: string;
  responsable?: { nom: string; prenom: string };
}

const ProjetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showLinkTaskDialog, setShowLinkTaskDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCurrentEmployee();
  }, [user, navigate]);

  useEffect(() => {
    if (id && currentEmployeeId) {
      fetchProjectDetails();
      fetchProjectTasks();
    }
  }, [id, currentEmployeeId]);

  const fetchCurrentEmployee = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user?.id)
      .maybeSingle();
    if (data) setCurrentEmployeeId(data.id);
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          responsable:employees!projects_responsable_id_fkey(nom, prenom)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Erreur lors du chargement du projet");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          task_id,
          tasks!inner(
            *,
            assigned_employee:employees!tasks_assigned_to_fkey(nom, prenom)
          )
        `)
        .eq("project_id", id)
        .order("ordre");

      if (error) throw error;
      setTasks(data?.map((pt) => pt.tasks) || []);
    } catch (error) {
      console.error("Error fetching project tasks:", error);
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "En cours";
      case "a_venir":
        return "À venir";
      case "termine":
        return "Terminé";
      case "en_pause":
        return "En pause";
      default:
        return statut;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "a_venir":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "termine":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "en_pause":
        return "bg-gray-500/10 text-gray-600 border-gray-200";
      default:
        return "";
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projets")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{project.titre}</h1>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
              </div>
              {project.is_priority && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Prioritaire
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Statut</p>
                <Badge variant="outline" className={getStatutColor(project.statut)}>
                  {getStatutLabel(project.statut)}
                </Badge>
              </div>
              {project.date_echeance && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Échéance</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(new Date(project.date_echeance), "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              )}
              {project.responsable && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Responsable</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {project.responsable.prenom} {project.responsable.nom}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Progression globale</p>
                <span className="text-sm font-medium">
                  {Math.round(project.progression)}%
                </span>
              </div>
              <Progress value={project.progression} className="h-3" />
            </div>
          </div>
        </Card>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList>
            <TabsTrigger value="tasks">Tâches ({tasks.length})</TabsTrigger>
            <TabsTrigger value="meetings">Réunions</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <div className="flex gap-2 mb-4">
              {(isAdmin || isManager) && (
                <>
                  <Button onClick={() => setShowCreateTaskDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une tâche
                  </Button>
                  <Button variant="outline" onClick={() => setShowLinkTaskDialog(true)}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Lier une tâche existante
                  </Button>
                </>
              )}
            </div>

            {tasks.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Aucune tâche associée à ce projet
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentEmployeeId={currentEmployeeId}
                    onUpdate={fetchProjectTasks}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Fonctionnalité de réunions à venir
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Timeline du projet à venir
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        currentEmployeeId={currentEmployeeId}
        onTaskCreated={() => {
          fetchProjectTasks();
          fetchProjectDetails();
        }}
        canAssignOthers={true}
        projectId={id}
      />

      <LinkTaskToProjectDialog
        open={showLinkTaskDialog}
        onOpenChange={setShowLinkTaskDialog}
        projectId={id!}
        onTaskLinked={() => {
          fetchProjectTasks();
          fetchProjectDetails();
        }}
      />
    </div>
  );
};

export default ProjetDetails;
