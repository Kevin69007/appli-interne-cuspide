import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Users, Edit } from "lucide-react";
import { useState } from "react";
import { EditEmployeeDialog } from "@/components/objectifs-primes/EditEmployeeDialog";
import { useUserRole } from "@/hooks/useUserRole";

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
  const { isAdmin, isManager } = useUserRole();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!employee) return null;

  const canEdit = isAdmin || isManager;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Fiche de poste</DialogTitle>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
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
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">{employee.email || "Non renseigné"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Groupe</p>
              <p className="font-medium">{employee.groupe || "Non renseigné"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Équipe</p>
              <p className="font-medium">{employee.equipe || "Non renseigné"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Poste</p>
              <p className="font-medium">{employee.poste || "Non renseigné"}</p>
            </div>
          </div>

          {/* Section missions et responsabilités */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Missions et responsabilités</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground italic">
                Les missions détaillées du poste peuvent être ajoutées ici dans une future mise à jour.
              </p>
            </div>
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
