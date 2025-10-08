import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  record_id: string | null;
  ancien_contenu: any;
  nouveau_contenu: any;
  created_at: string;
  user_id: string | null;
  user_email?: string;
  user_name?: string;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  user_id: string | null;
}

export default function Logs() {
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Accès refusé - Réservé aux administrateurs");
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
      fetchEmployees();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [logs, dateDebut, dateFin, selectedUser, selectedTable]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom, user_id")
      .order("nom");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data: logsData, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Enrichir les logs avec les informations utilisateur
      const enrichedLogs = await Promise.all(
        (logsData || []).map(async (log) => {
          if (log.user_id) {
            // Chercher d'abord dans employees
            const { data: employee } = await supabase
              .from("employees")
              .select("nom, prenom")
              .eq("user_id", log.user_id)
              .single();

            if (employee) {
              return {
                ...log,
                user_name: `${employee.prenom} ${employee.nom}`,
              };
            }

            // Sinon chercher dans profiles
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("user_id", log.user_id)
              .single();

            if (profile) {
              return {
                ...log,
                user_email: profile.email,
                user_name: profile.full_name || profile.email,
              };
            }
          }
          return log;
        })
      );

      setLogs(enrichedLogs);
    } catch (error) {
      console.error("Erreur lors du chargement des logs:", error);
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filtre par date de début
    if (dateDebut) {
      const debut = new Date(dateDebut);
      filtered = filtered.filter((log) => new Date(log.created_at) >= debut);
    }

    // Filtre par date de fin
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999); // Inclure toute la journée
      filtered = filtered.filter((log) => new Date(log.created_at) <= fin);
    }

    // Filtre par utilisateur
    if (selectedUser !== "all") {
      filtered = filtered.filter((log) => log.user_id === selectedUser);
    }

    // Filtre par table
    if (selectedTable !== "all") {
      filtered = filtered.filter((log) => log.table_name === selectedTable);
    }

    setFilteredLogs(filtered);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "INSERT":
        return "default";
      case "UPDATE":
        return "secondary";
      case "DELETE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getUniqueTables = () => {
    const tables = [...new Set(logs.map((log) => log.table_name))];
    return tables.sort();
  };

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Journal d'audit - Traçabilité des actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Utilisateur</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.user_id || emp.id}>
                      {emp.prenom} {emp.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="table">Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les tables</SelectItem>
                  {getUniqueTables().map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Résumé */}
          <div className="text-sm text-muted-foreground">
            {filteredLogs.length} action(s) trouvée(s)
          </div>

          {/* Table des logs */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Ancien contenu</TableHead>
                    <TableHead>Nouveau contenu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Aucune action trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          {log.user_name || log.user_email || "Système"}
                        </TableCell>
                        <TableCell>{log.table_name}</TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs overflow-hidden text-ellipsis">
                            {log.ancien_contenu ? (
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(log.ancien_contenu, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs overflow-hidden text-ellipsis">
                            {log.nouveau_contenu ? (
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(log.nouveau_contenu, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
