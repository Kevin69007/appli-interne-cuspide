import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEmployee } from "@/contexts/EmployeeContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Plus, ArrowLeft, Briefcase } from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters, type ProjectFilters as ProjectFiltersType } from "@/components/projects/ProjectFilters";
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
  const [filters, setFilters] = useState<ProjectFiltersType>({
    responsableId: null,
    statut: [],
    sortBy: null,
    sortOrder: "desc",
  });

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

  // Extraire les responsables uniques
  const uniqueResponsables = useMemo(() => {
    const responsablesMap = new Map();
    projects.forEach((p) => {
      if (p.responsable && p.responsable_id) {
        responsablesMap.set(p.responsable_id, {
          id: p.responsable_id,
          nom: p.responsable.nom,
          prenom: p.responsable.prenom,
        });
      }
    });
    return Array.from(responsablesMap.values());
  }, [projects]);

  // Appliquer les filtres et le tri
  const filteredAndSortedProjects = useMemo(() => {
    // 1. Filtrer
    let result = projects.filter((p) => {
      // Filtre par responsable
      if (filters.responsableId && p.responsable_id !== filters.responsableId) {
        return false;
      }
      // Filtre par statut (multi-select)
      if (filters.statut.length > 0 && !filters.statut.includes(p.statut)) {
        return false;
      }
      return true;
    });

    // 2. Trier
    if (filters.sortBy) {
      result = [...result].sort((a, b) => {
        if (filters.sortBy === "priorite") {
          return filters.sortOrder === "desc"
            ? (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0)
            : (a.is_priority ? 1 : 0) - (b.is_priority ? 1 : 0);
        }
        if (filters.sortBy === "date_echeance" || filters.sortBy === "created_at") {
          const dateA = new Date(a[filters.sortBy] || 0).getTime();
          const dateB = new Date(b[filters.sortBy] || 0).getTime();
          return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
    }

    return result;
  }, [projects, filters]);

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

        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          responsables={uniqueResponsables}
          totalProjects={projects.length}
          filteredCount={filteredAndSortedProjects.length}
        />

        <div className="mt-6">
          {renderProjects(filteredAndSortedProjects)}
        </div>
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
