import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  poste: string | null;
  user_id: string | null;
  role?: string;
}

export const EmployeesList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .order("nom");

      if (employeesError) throw employeesError;

      // Fetch roles for each employee
      const employeesWithRoles = await Promise.all(
        (employeesData || []).map(async (emp) => {
          if (emp.user_id) {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", emp.user_id)
              .single();
            
            return { ...emp, role: roleData?.role || "user" };
          }
          return emp;
        })
      );

      setEmployees(employeesWithRoles);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "manager":
        return "Manager";
      default:
        return "Collaborateur";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun employé pour le moment</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Prénom</TableHead>
          <TableHead>Poste</TableHead>
          <TableHead>Rôle</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.nom}</TableCell>
            <TableCell>{employee.prenom}</TableCell>
            <TableCell>{employee.poste || "-"}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(employee.role)}>
                {getRoleLabel(employee.role)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
