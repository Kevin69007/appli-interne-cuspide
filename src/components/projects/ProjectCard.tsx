import { useState, memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, Pencil } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { EditProjectDialog } from "./EditProjectDialog";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { useTranslation } from "react-i18next";

interface ProjectCardProps {
  project: {
    id: string;
    titre: string;
    description: string;
    statut: string;
    date_echeance: string;
    progression: number;
    is_priority: boolean;
    responsable_id: string;
    responsable?: { nom: string; prenom: string; photo_url?: string };
  };
  onUpdate: () => void;
  currentEmployeeId: string | null;
  canEdit: boolean;
}

export const ProjectCard = memo(({ project, onUpdate, currentEmployeeId, canEdit }: ProjectCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['projects', 'common']);
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return t('statuses.inProgress');
      case "a_venir":
        return t('statuses.upcoming');
      case "termine":
        return t('statuses.completed');
      case "en_pause":
        return t('statuses.onHold');
      default:
        return statut;
    }
  };

  const statutColor = useMemo(() => getStatutColor(project.statut), [project.statut]);
  const statutLabel = useMemo(() => getStatutLabel(project.statut), [project.statut, i18n.language]);

  return (
    <>
      <Card
        className="p-6 cursor-pointer hover:shadow-lg transition-all relative"
        onClick={() => navigate(`/projets/${project.id}`)}
      >
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setShowEditDialog(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2 pr-10">
            <div className="flex-1">
              <h3 className="text-lg font-semibold line-clamp-2">
                {project.titre}
              </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          {project.is_priority && (
            <Badge variant="destructive" className="shrink-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t('priority')}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('progression')}</span>
            <span className="font-medium">{Math.round(project.progression)}%</span>
          </div>
          <Progress value={project.progression} className="h-2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statutColor}>
            {statutLabel}
          </Badge>
          {project.date_echeance && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(project.date_echeance), "dd MMM yyyy", {
                locale: dateLocale,
              })}
            </Badge>
          )}
        </div>

        {project.responsable && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <EmployeeAvatar
              photoUrl={project.responsable.photo_url}
              nom={project.responsable.nom}
              prenom={project.responsable.prenom}
              size="sm"
            />
            <span>
              {project.responsable.prenom} {project.responsable.nom}
            </span>
          </div>
        )}
      </div>
    </Card>

    <EditProjectDialog
      open={showEditDialog}
      onOpenChange={setShowEditDialog}
      project={project}
      currentEmployeeId={currentEmployeeId}
      onProjectUpdated={onUpdate}
    />
    </>
  );
});