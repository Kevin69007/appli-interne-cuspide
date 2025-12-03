import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Settings, Search } from "lucide-react";
import { LeaveConfigTab } from "./LeaveConfigTab";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { fetchLeaveConfig, calculateLeaveBalance, LeaveConfig, LeaveBalance } from "@/lib/leaveBalanceUtils";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  equipe: string | null;
  photo_url: string | null;
}

interface EmployeeWithConfig extends Employee {
  config: LeaveConfig | null;
  balance: LeaveBalance | null;
}

export const LeaveConfigPanel = () => {
  const [employees, setEmployees] = useState<EmployeeWithConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nom, prenom, equipe, photo_url")
        .order("nom", { ascending: true });

      if (error) throw error;

      // Fetch config and balance for each employee
      const employeesWithConfig = await Promise.all(
        (data || []).map(async (emp) => {
          const config = await fetchLeaveConfig(emp.id);
          const balance = await calculateLeaveBalance(emp.id);
          return { ...emp, config, balance };
        })
      );

      setEmployees(employeesWithConfig);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSaved = () => {
    setSelectedEmployee(null);
    fetchEmployees();
  };

  const getDayTypeLabel = (dayType: string | undefined) => {
    return dayType === 'ouvrable' ? 'ouvrables' : 'ouvrés';
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.prenom} ${emp.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.equipe && emp.equipe.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">{filteredEmployees.length} employé(s)</Badge>
      </div>

      <div className="grid gap-3">
        {filteredEmployees.map((emp) => (
          <Card key={emp.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EmployeeAvatar
                    photoUrl={emp.photo_url}
                    nom={emp.nom}
                    prenom={emp.prenom}
                    size="md"
                  />
                  <div>
                    <div className="font-medium">
                      {emp.prenom} {emp.nom}
                    </div>
                    {emp.equipe && (
                      <Badge variant="secondary" className="mt-1">
                        {emp.equipe}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {emp.config ? (
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">
                        {emp.config.total_days_allowed}j {getDayTypeLabel(emp.config.day_type)}
                      </div>
                      {emp.balance && (
                        <div className={emp.balance.remainingApproved >= 0 ? "text-green-600" : "text-red-600"}>
                          Solde : {emp.balance.remainingApproved}j
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Non configuré</div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Configuration congés - {selectedEmployee?.prenom} {selectedEmployee?.nom}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <LeaveConfigTab
              employeeId={selectedEmployee.id}
              onClose={handleConfigSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
