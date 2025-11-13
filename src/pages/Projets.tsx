import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Briefcase } from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { toast } from "sonner";

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

const Projets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);
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
      fetchProjects();
    }
  }, [currentEmployeeId]);

  const fetchCurrentEmployee = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (!error && data) {
      setCurrentEmployeeId(data.id);
    }
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          responsable:employees!projects_responsable_id_fkey(nom, prenom)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  }, []);

  const enCoursProjects = useMemo(
    () => projects.filter((p) => p.statut === "en_cours"),
    [projects]
  );
  const aVenirProjects = useMemo(
    () => projects.filter((p) => p.statut === "a_venir"),
    [projects]
  );
  const terminesProjects = useMemo(
    () => projects.filter((p) => p.statut === "termine"),
    [projects]
  );
  const enPauseProjects = useMemo(
    () => projects.filter((p) => p.statut === "en_pause"),
    [projects]
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Projets</h1>
            </div>
          </div>
          {(isAdmin || isManager) && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          )}
        </div>

        <Tabs defaultValue="en_cours" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="en_cours">
              En cours ({enCoursProjects.length})
            </TabsTrigger>
            <TabsTrigger value="a_venir">
              À venir ({aVenirProjects.length})
            </TabsTrigger>
            <TabsTrigger value="en_pause">
              En pause ({enPauseProjects.length})
            </TabsTrigger>
            <TabsTrigger value="termines">
              Terminés ({terminesProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="en_cours" className="mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : enCoursProjects.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun projet en cours
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enCoursProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onUpdate={fetchProjects}
                    currentEmployeeId={currentEmployeeId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="a_venir" className="mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : aVenirProjects.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun projet à venir
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aVenirProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onUpdate={fetchProjects}
                    currentEmployeeId={currentEmployeeId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="en_pause" className="mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : enPauseProjects.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun projet en pause
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enPauseProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onUpdate={fetchProjects}
                    currentEmployeeId={currentEmployeeId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="termines" className="mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : terminesProjects.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun projet terminé
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {terminesProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onUpdate={fetchProjects}
                    currentEmployeeId={currentEmployeeId}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentEmployeeId={currentEmployeeId}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
};

export default Projets;
