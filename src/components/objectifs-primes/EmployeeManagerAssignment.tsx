import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCog, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  poste: string | null;
  equipe: string | null;
  manager_id: string | null;
  manager_nom?: string;
  manager_prenom?: string;
}

export const EmployeeManagerAssignment = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEquipe, setFilterEquipe] = useState<string>("all");
  const [filterManager, setFilterManager] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [equipes, setEquipes] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Récupérer les user_ids des managers
    const { data: managerRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["manager", "admin"]);

    if (rolesError) {
      console.error("Erreur:", rolesError);
      toast.error("Erreur lors du chargement des managers");
      setLoading(false);
      return;
    }

    const managerUserIds = (managerRoles || []).map(r => r.user_id);

    // Récupérer les employés qui sont managers
    const { data: managersData, error: managersError } = await supabase
      .from("employees")
      .select("id, nom, prenom, poste, equipe, manager_id")
      .in("user_id", managerUserIds)
      .order("nom");

    if (managersError) {
      console.error("Erreur:", managersError);
      toast.error("Erreur lors du chargement des managers");
    } else {
      setManagers(managersData || []);
    }

    // Récupérer tous les employés avec leur manager
    const { data: employeesData, error: employeesError } = await supabase
      .from("employees")
      .select(`
        id,
        nom,
        prenom,
        poste,
        equipe,
        manager_id,
        manager:employees!employees_manager_id_fkey(nom, prenom)
      `)
      .order("nom");

    if (employeesError) {
      console.error("Erreur:", employeesError);
      toast.error("Erreur lors du chargement des employés");
    } else {
      const formattedEmployees = (employeesData || []).map((emp: any) => ({
        id: emp.id,
        nom: emp.nom,
        prenom: emp.prenom,
        poste: emp.poste,
        equipe: emp.equipe,
        manager_id: emp.manager_id,
        manager_nom: emp.manager?.nom,
        manager_prenom: emp.manager?.prenom,
      }));
      setEmployees(formattedEmployees);

      // Extraire les équipes uniques
      const uniqueEquipes = [...new Set(employeesData.map((e: any) => e.equipe).filter(Boolean))];
      setEquipes(uniqueEquipes as string[]);
    }

    setLoading(false);
  };

  const handleAssignManager = async () => {
    if (selectedEmployees.length === 0) {
      toast.error("Veuillez sélectionner au moins un employé");
      return;
    }

    if (!selectedManager && selectedManager !== "none") {
      toast.error("Veuillez sélectionner un manager");
      return;
    }

    setLoading(true);

    const managerId = selectedManager === "none" ? null : selectedManager;

    const { error } = await supabase
      .from("employees")
      .update({ manager_id: managerId })
      .in("id", selectedEmployees);

    if (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'affectation");
    } else {
      toast.success(
        `${selectedEmployees.length} employé(s) ${managerId ? "affecté(s)" : "libéré(s)"} avec succès`
      );
      setSelectedEmployees([]);
      setSelectedManager("");
      fetchData();
    }

    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e.id));
    }
  };

  const toggleSelectEmployee = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.prenom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEquipe = filterEquipe === "all" || emp.equipe === filterEquipe;

    const matchesManager =
      filterManager === "all" ||
      (filterManager === "none" && !emp.manager_id) ||
      emp.manager_id === filterManager;

    return matchesSearch && matchesEquipe && matchesManager;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Affectation des managers aux employés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section d'affectation */}
        <div className="flex items-end gap-4 p-4 bg-muted rounded-lg">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Sélectionner un manager</label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un manager..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Retirer le manager</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.prenom} {manager.nom} {manager.poste && `- ${manager.poste}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAssignManager}
            disabled={loading || selectedEmployees.length === 0}
          >
            Affecter aux {selectedEmployees.length} sélectionnés
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterEquipe} onValueChange={setFilterEquipe}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par équipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les équipes</SelectItem>
              {equipes.map((equipe) => (
                <SelectItem key={equipe} value={equipe}>
                  {equipe}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterManager} onValueChange={setFilterManager}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="none">Sans manager</SelectItem>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.prenom} {manager.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tableau des employés */}
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={
                        filteredEmployees.length > 0 &&
                        selectedEmployees.length === filteredEmployees.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Nom</th>
                  <th className="p-3 text-left font-medium">Prénom</th>
                  <th className="p-3 text-left font-medium">Poste</th>
                  <th className="p-3 text-left font-medium">Équipe</th>
                  <th className="p-3 text-left font-medium">Manager actuel</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucun employé trouvé
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => toggleSelectEmployee(employee.id)}
                        />
                      </td>
                      <td className="p-3">{employee.nom}</td>
                      <td className="p-3">{employee.prenom}</td>
                      <td className="p-3">{employee.poste || "-"}</td>
                      <td className="p-3">{employee.equipe || "-"}</td>
                      <td className="p-3">
                        {employee.manager_nom && employee.manager_prenom ? (
                          <Badge variant="secondary">
                            {employee.manager_prenom} {employee.manager_nom}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non assigné</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedEmployees.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedEmployees.length} employé(s) sélectionné(s)
          </div>
        )}
      </CardContent>
    </Card>
  );
};
