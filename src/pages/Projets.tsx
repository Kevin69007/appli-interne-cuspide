import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEmployee } from "@/contexts/EmployeeContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  responsable?: { nom: string; prenom: string; photo_url?: string };
}

const Projets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const { employee } = useEmployee();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Parallelize employee and projects queries
  const { data: projects = [], isLoading: loading, refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          responsable:employees!projects_responsable_id_fkey(nom, prenom, photo_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // Cache 2 minutes
  });

  const canEdit = isAdmin || isManager;

  const enCoursProjects = useMemo(() => projects.filter((p) => p.statut === "en_cours"), [projects]);
  const aVenirProjects = useMemo(() => projects.filter((p) => p.statut === "a_venir"), [projects]);
  const terminesProjects = useMemo(() => projects.filter((p) => p.statut === "termine"), [projects]);
  const enPauseProjects = useMemo(() => projects.filter((p) => p.statut === "en_pause"), [projects]);

  const SkeletonCard = () => (
    <Card className="p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-2 bg-muted rounded w-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted rounded w-20" />
          <div className="h-6 bg-muted rounded w-24" />
        </div>
      </div>
    </Card>
  );

  const renderProjects = (projectList: Project[]) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (projectList.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          Aucun projet dans cette catégorie
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectList.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onUpdate={refetchProjects}
            currentEmployeeId={employee?.id || null}
            canEdit={canEdit}
          />
        ))}
      </div>
    );
  };

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
            {renderProjects(enCoursProjects)}
          </TabsContent>

          <TabsContent value="a_venir" className="mt-6">
            {renderProjects(aVenirProjects)}
          </TabsContent>

          <TabsContent value="en_pause" className="mt-6">
            {renderProjects(enPauseProjects)}
          </TabsContent>

          <TabsContent value="termines" className="mt-6">
            {renderProjects(terminesProjects)}
          </TabsContent>
        </Tabs>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentEmployeeId={employee?.id || null}
        onProjectCreated={refetchProjects}
      />
    </div>
  );
};

export default Projets;
