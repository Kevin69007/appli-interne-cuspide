import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Users, Edit } from "lucide-react";
import { useState } from "react";
import { EditEmployeeDialog } from "@/components/objectifs-primes/EditEmployeeDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { BadgesSection } from "./BadgesSection";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  equipe: string;
  photo_url: string | null;
  email: string | null;
  groupe: string | null;
}

interface FichePosteDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeUpdated?: () => void;
}

export const FichePosteDialog = ({ employee, open, onOpenChange, onEmployeeUpdated }: FichePosteDialogProps) => {
  const { t } = useTranslation("rh");
  const { isAdmin, isManager } = useUserRole();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!employee) return null;

  const canEdit = isAdmin || isManager;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t("fichePoste.title")}</DialogTitle>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t("fichePoste.edit")}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec photo */}
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
              {employee.photo_url ? (
                <img 
                  src={employee.photo_url} 
                  alt={`${employee.prenom} ${employee.nom}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {employee.prenom} {employee.nom}
              </h2>
              
              <div className="space-y-2">
                {employee.poste && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{employee.poste}</span>
                  </div>
                )}
                
                {employee.equipe && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="secondary">{employee.equipe}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("fichePoste.email")}</p>
              <p className="font-medium">{employee.email || t("fichePoste.notSpecified")}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("fichePoste.group")}</p>
              <p className="font-medium">{employee.groupe || t("fichePoste.notSpecified")}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("fichePoste.team")}</p>
              <p className="font-medium">{employee.equipe || t("fichePoste.notSpecified")}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("fichePoste.position")}</p>
              <p className="font-medium">{employee.poste || t("fichePoste.notSpecified")}</p>
            </div>
          </div>

          {/* Section Badges - Remplace "Missions et responsabilités" */}
          <div className="pt-4 border-t">
            <BadgesSection employeeId={employee.id} />
          </div>
        </div>
      </DialogContent>

      {canEdit && (
        <EditEmployeeDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          employeeId={employee.id}
          onEmployeeUpdated={() => {
            onEmployeeUpdated?.();
            setEditDialogOpen(false);
          }}
        />
      )}
    </Dialog>
  );
};
