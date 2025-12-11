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
import { SortableProjectCard } from "@/components/projects/SortableProjectCard";
import { ProjectFilters, type ProjectFilters as ProjectFiltersType } from "@/components/projects/ProjectFilters";
import { ModuleHelpButton } from "@/components/communication/ModuleHelpButton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

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
  sort_order: number;
  responsable?: { nom: string; prenom: string; photo_url?: string };
}

// Priorité des statuts (plus bas = plus prioritaire)
const STATUS_PRIORITY: Record<string, number> = {
  'en_cours': 1,
  'a_venir': 2,
  'en_pause': 3,
  'termine': 4,
};

const Projets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const { employee } = useEmployee();
  const { t } = useTranslation(['projects', 'common']);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProjectFiltersType>({
    responsableId: null,
    statut: [],
    sortBy: null,
    sortOrder: "desc",
  });

  const isAdminOrManager = isAdmin || isManager;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch projects
  const { data: projects = [], isLoading: loading, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', isAdminOrManager, employee?.id],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select(`
          *,
          responsable:employees!projects_responsable_id_fkey(nom, prenom, photo_url)
        `);

      // Employees only see projects assigned to them
      if (!isAdminOrManager && employee?.id) {
        query = query.eq("responsable_id", employee.id);
      }

      const { data, error } = await query.order("sort_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdminOrManager || !!employee?.id,
    staleTime: 1000 * 60 * 2,
  });

  const canEdit = isAdminOrManager;

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
      if (filters.responsableId && p.responsable_id !== filters.responsableId) {
        return false;
      }
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
        
        if (filters.sortBy === "date_echeance") {
          const dateA = a.date_echeance ? new Date(a.date_echeance).getTime() : null;
          const dateB = b.date_echeance ? new Date(b.date_echeance).getTime() : null;
          
          // Les deux ont une date -> trier par date
          if (dateA && dateB) {
            return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
          }
          
          // Un seul a une date -> celui avec date passe devant (asc) ou derrière (desc)
          if (dateA && !dateB) {
            return filters.sortOrder === "asc" ? -1 : 1;
          }
          if (!dateA && dateB) {
            return filters.sortOrder === "asc" ? 1 : -1;
          }
          
          // Aucun n'a de date -> trier par statut (en_cours < à_venir < en_pause < terminé)
          const priorityA = STATUS_PRIORITY[a.statut] || 99;
          const priorityB = STATUS_PRIORITY[b.statut] || 99;
          return priorityA - priorityB;
        }
        
        if (filters.sortBy === "created_at") {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
        
        return 0;
      });
    } else {
      // Pas de tri actif -> utiliser l'ordre personnalisé (localOrder) ou sort_order de la DB
      if (localOrder.length > 0) {
        result = [...result].sort((a, b) => {
          const indexA = localOrder.indexOf(a.id);
          const indexB = localOrder.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      }
    }

    return result;
  }, [projects, filters, localOrder]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredAndSortedProjects.findIndex(p => p.id === active.id);
    const newIndex = filteredAndSortedProjects.findIndex(p => p.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(filteredAndSortedProjects, oldIndex, newIndex);
    
    // Optimistic update
    setLocalOrder(newOrder.map(p => p.id));
    
    // Persister dans Supabase
    try {
      await Promise.all(newOrder.map((project, index) => 
        supabase.from("projects").update({ sort_order: index }).eq("id", project.id)
      ));
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error(t('errorSavingOrder'));
      refetchProjects();
    }
  };

  const SkeletonCard = () => (
    <Card className="p-4 sm:p-6 animate-pulse">
      <div className="space-y-3 sm:space-y-4">
        <div className="h-4 sm:h-5 bg-muted rounded w-3/4" />
        <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
        <div className="space-y-1.5 sm:space-y-2">
          <div className="h-2.5 sm:h-3 bg-muted rounded w-full" />
          <div className="h-1.5 sm:h-2 bg-muted rounded w-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 sm:h-6 bg-muted rounded w-16 sm:w-20" />
          <div className="h-5 sm:h-6 bg-muted rounded w-20 sm:w-24" />
        </div>
      </div>
    </Card>
  );

  const renderProjects = (projectList: Project[]) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (projectList.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base">
          {t('noProjects')}
        </p>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={projectList.map(p => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pl-0 sm:pl-4">
            {projectList.map((project) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                onUpdate={refetchProjects}
                currentEmployeeId={employee?.id || null}
                canEdit={canEdit}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-xl sm:text-3xl font-bold">{t('title')}</h1>
              <ModuleHelpButton moduleId="projects" />
            </div>
          </div>
          {isAdminOrManager && (
            <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto text-sm">
              <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="sm:hidden">{t('new')}</span>
              <span className="hidden sm:inline">{t('newProject')}</span>
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

        <div className="mt-4 sm:mt-6">
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