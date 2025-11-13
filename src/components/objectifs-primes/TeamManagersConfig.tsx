import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, X } from "lucide-react";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  equipe: string;
}

interface TeamAssignment {
  manager_employee_id: string;
  equipe: string;
}

export const TeamManagersConfig = () => {
  const [managers, setManagers] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Récupérer les managers
    const { data: managersData } = await supabase
      .from('employees')
      .select('id, nom, prenom, poste, equipe, user_id')
      .not('user_id', 'is', null);

    if (managersData) {
      // Filtrer ceux qui ont le rôle manager
      const managerIds = await Promise.all(
        managersData.map(async (emp) => {
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', emp.user_id)
            .eq('role', 'manager')
            .maybeSingle();
          return data ? emp : null;
        })
      );

      setManagers(managerIds.filter(m => m !== null) as Employee[]);
    }

    // Récupérer les équipes distinctes
    const { data: teamsData } = await supabase
      .from('employees')
      .select('equipe')
      .not('equipe', 'is', null);

    if (teamsData) {
      const uniqueTeams = [...new Set(teamsData.map(t => t.equipe))];
      setTeams(uniqueTeams as string[]);
    }

    // Récupérer les affectations existantes
    const { data: assignmentsData } = await supabase
      .from('team_managers')
      .select('*');

    if (assignmentsData) {
      setAssignments(assignmentsData);
    }
  };

  const getManagerTeams = (managerId: string) => {
    return assignments
      .filter(a => a.manager_employee_id === managerId)
      .map(a => a.equipe);
  };

  const handleAddAssignment = async () => {
    if (!selectedManager || !selectedTeam) {
      toast.error("Veuillez sélectionner un manager et une équipe");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_managers')
        .insert({
          manager_employee_id: selectedManager,
          equipe: selectedTeam
        });

      if (error) throw error;

      toast.success("Manager assigné à l'équipe");
      setSelectedManager("");
      setSelectedTeam("");
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("Ce manager est déjà assigné à cette équipe");
      } else {
        toast.error("Erreur lors de l'assignation");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (managerId: string, equipe: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_managers')
        .delete()
        .eq('manager_employee_id', managerId)
        .eq('equipe', equipe);

      if (error) throw error;

      toast.success("Assignation supprimée");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Affectation des managers aux équipes
        </CardTitle>
        <CardDescription>
          Assignez chaque manager aux équipes qu'il gère. Les managers ne verront que les données de leurs équipes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Affectation rapide */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h3 className="font-semibold text-sm">Affectation rapide</h3>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choisir un manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.prenom} {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choisir une équipe" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddAssignment} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Assigner
            </Button>
          </div>
        </div>

        {/* Tableau des affectations */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manager</TableHead>
              <TableHead>Équipes assignées</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map(manager => {
              const managerTeams = getManagerTeams(manager.id);
              return (
                <TableRow key={manager.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {manager.prenom[0]}{manager.nom[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{manager.prenom} {manager.nom}</p>
                        <p className="text-xs text-muted-foreground">{manager.poste}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {managerTeams.length > 0 ? (
                        managerTeams.map(team => (
                          <Badge key={team} variant="secondary" className="gap-1">
                            {team}
                            <button
                              onClick={() => handleRemoveAssignment(manager.id, team)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Aucune équipe assignée</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {managerTeams.length} équipe(s)
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {managers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucun manager trouvé. Assignez le rôle "manager" à des employés d'abord.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
