import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  poste: string | null;
}

interface EmployeePermission extends Employee {
  can_access_meetings: boolean;
  permission_id: string | null;
}

export default function AdminReunions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [employees, setEmployees] = useState<EmployeePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits pour accéder à cette page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchEmployeesWithPermissions();
    }
  }, [isAdmin]);

  const fetchEmployeesWithPermissions = async () => {
    try {
      setLoading(true);
      
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("id, nom, prenom, email, poste")
        .order("nom", { ascending: true });

      if (employeesError) throw employeesError;

      // Fetch all meeting permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("meeting_permissions")
        .select("id, employee_id, can_access_meetings");

      if (permissionsError) throw permissionsError;

      // Merge data
      const permissionsMap = new Map(
        permissionsData?.map(p => [p.employee_id, p]) || []
      );

      const employeesWithPermissions: EmployeePermission[] = (employeesData || []).map(emp => ({
        ...emp,
        can_access_meetings: permissionsMap.get(emp.id)?.can_access_meetings || false,
        permission_id: permissionsMap.get(emp.id)?.id || null,
      }));

      setEmployees(employeesWithPermissions);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (employeeId: string, currentValue: boolean, permissionId: string | null) => {
    try {
      setUpdating(employeeId);
      
      if (permissionId) {
        // Update existing permission
        const { error } = await supabase
          .from("meeting_permissions")
          .update({ can_access_meetings: !currentValue })
          .eq("id", permissionId);

        if (error) throw error;
      } else {
        // Create new permission
        const { error } = await supabase
          .from("meeting_permissions")
          .insert({
            employee_id: employeeId,
            can_access_meetings: true,
          });

        if (error) throw error;
      }

      // Refresh the list
      await fetchEmployeesWithPermissions();

      toast({
        title: "Succès",
        description: "Permission mise à jour",
      });
    } catch (error) {
      console.error("Error updating permission:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la permission",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/reunions")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gestion des Permissions - Réunions</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les autorisations d'accès au module réunion
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Autorisations par employé</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Les employés autorisés pourront voir les réunions auxquelles ils participent sans pouvoir télécharger l'audio.
            Seuls les administrateurs peuvent enregistrer des réunions et télécharger les fichiers audio.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Accès réunions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.nom}</TableCell>
                <TableCell>{employee.prenom}</TableCell>
                <TableCell>{employee.poste || "-"}</TableCell>
                <TableCell>{employee.email || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Switch
                      checked={employee.can_access_meetings}
                      onCheckedChange={() =>
                        togglePermission(
                          employee.id,
                          employee.can_access_meetings,
                          employee.permission_id
                        )
                      }
                      disabled={updating === employee.id}
                    />
                    {updating === employee.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
