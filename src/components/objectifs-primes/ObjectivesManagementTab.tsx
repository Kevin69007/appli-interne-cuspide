import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Edit, Copy, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { EditObjectiveDialog } from "./EditObjectiveDialog";
import { DuplicateObjectiveDialog } from "./DuplicateObjectiveDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ObjectiveGroup {
  employee_id: string;
  employee_name: string;
  indicator_name: string;
  recurrence: string;
  target_value: number;
  points: number;
  unit: string;
  period_start: string;
  period_end: string;
  total_occurrences: number;
  declared_occurrences: number;
  entry_ids: string[];
  statuses: string[];
}

export const ObjectivesManagementTab = () => {
  const { t } = useTranslation();
  const [objectives, setObjectives] = useState<ObjectiveGroup[]>([]);
  const [filteredObjectives, setFilteredObjectives] = useState<ObjectiveGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveGroup | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchObjectives();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [objectives, searchTerm, selectedEmployee, selectedRecurrence, selectedStatus]);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");

    if (data) {
      setEmployees(data.map(e => ({ id: e.id, name: `${e.prenom} ${e.nom}` })));
    }
  };

  const fetchObjectives = async () => {
    setLoading(true);
    try {
      const { data: entries, error } = await supabase
        .from("agenda_entries")
        .select(`
          id,
          employee_id,
          date,
          type,
          valeur_declaree,
          points_indicateur,
          statut_objectif,
          detail,
          employees (
            nom,
            prenom
          )
        `)
        .eq("categorie", "indicateurs" as any)
        .order("date", { ascending: true });

      if (error) throw error;

      // Group by employee + indicator + period
      const grouped = new Map<string, ObjectiveGroup>();

      entries?.forEach((entry: any) => {
        const detail = entry.detail ? JSON.parse(entry.detail) : {};
        const key = `${entry.employee_id}-${detail.nom || "unknown"}-${detail.recurrence || "mois"}`;
        
        if (!grouped.has(key)) {
          grouped.set(key, {
            employee_id: entry.employee_id,
            employee_name: `${entry.employees?.prenom || ""} ${entry.employees?.nom || ""}`,
            indicator_name: detail.nom || entry.type || "Sans nom",
            recurrence: detail.recurrence || "mois",
            target_value: detail.valeur_cible || 0,
            points: entry.points_indicateur || 0,
            unit: detail.unite || "",
            period_start: entry.date,
            period_end: entry.date,
            total_occurrences: 0,
            declared_occurrences: 0,
            entry_ids: [],
            statuses: [],
          });
        }

        const group = grouped.get(key)!;
        group.total_occurrences++;
        group.entry_ids.push(entry.id);
        group.statuses.push(entry.statut_objectif || "en_attente");
        
        if (entry.valeur_declaree !== null) {
          group.declared_occurrences++;
        }

        // Update period range
        if (entry.date < group.period_start) group.period_start = entry.date;
        if (entry.date > group.period_end) group.period_end = entry.date;
      });

      setObjectives(Array.from(grouped.values()));
    } catch (error) {
      console.error("Error fetching objectives:", error);
      toast.error("Erreur lors du chargement des objectifs");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = objectives;

    if (searchTerm) {
      filtered = filtered.filter(
        obj =>
          obj.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obj.indicator_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEmployee !== "all") {
      filtered = filtered.filter(obj => obj.employee_id === selectedEmployee);
    }

    if (selectedRecurrence !== "all") {
      filtered = filtered.filter(obj => obj.recurrence === selectedRecurrence);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(obj => obj.statuses.includes(selectedStatus));
    }

    setFilteredObjectives(filtered);
  };

  const handleEdit = (objective: ObjectiveGroup) => {
    setSelectedObjective(objective);
    setEditDialogOpen(true);
  };

  const handleDuplicate = (objective: ObjectiveGroup) => {
    setSelectedObjective(objective);
    setDuplicateDialogOpen(true);
  };

  const handleDeleteClick = (objective: ObjectiveGroup) => {
    if (objective.declared_occurrences > 0) {
      toast.error(t("indicators.management.cannotDeleteDeclared"));
      return;
    }
    setSelectedObjective(objective);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedObjective) return;

    try {
      const { error } = await supabase
        .from("agenda_entries")
        .delete()
        .in("id", selectedObjective.entry_ids);

      if (error) throw error;

      toast.success(t("indicators.management.deleteSuccess"));
      fetchObjectives();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting objective:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getRecurrenceLabel = (recurrence: string) => {
    const labels: Record<string, string> = {
      jour: "Jour",
      semaine: "Semaine",
      mois: "Mois",
    };
    return labels[recurrence] || recurrence;
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })} → ${endDate.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">{t("indicators.management.loadingObjectives")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{t("indicators.management.filters")}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder={t("indicators.management.allEmployees")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("indicators.management.allEmployees")}</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRecurrence} onValueChange={setSelectedRecurrence}>
              <SelectTrigger>
                <SelectValue placeholder={t("indicators.management.allRecurrences")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("indicators.management.allRecurrences")}</SelectItem>
                <SelectItem value="jour">Jour</SelectItem>
                <SelectItem value="semaine">Semaine</SelectItem>
                <SelectItem value="mois">Mois</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t("indicators.management.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("indicators.management.allStatuses")}</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("indicators.management.employee")}</TableHead>
              <TableHead>{t("indicators.management.indicatorName")}</TableHead>
              <TableHead>{t("indicators.management.recurrence")}</TableHead>
              <TableHead>{t("indicators.management.period")}</TableHead>
              <TableHead>{t("indicators.management.targetValue")}</TableHead>
              <TableHead>{t("indicators.management.points")}</TableHead>
              <TableHead>{t("indicators.management.occurrences")}</TableHead>
              <TableHead className="text-right">{t("indicators.management.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredObjectives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t("indicators.management.noObjectives")}
                </TableCell>
              </TableRow>
            ) : (
              filteredObjectives.map((obj, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{obj.employee_name}</TableCell>
                  <TableCell>{obj.indicator_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getRecurrenceLabel(obj.recurrence)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatPeriod(obj.period_start, obj.period_end)}</TableCell>
                  <TableCell>
                    {obj.target_value} {obj.unit}
                  </TableCell>
                  <TableCell>
                    <Badge>{obj.points} pts</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        {t("indicators.management.seriesOf", { count: obj.total_occurrences })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("indicators.management.progressRate", {
                          declared: obj.declared_occurrences,
                          total: obj.total_occurrences,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(obj)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicate(obj)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(obj)}
                        disabled={obj.declared_occurrences > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {selectedObjective && (
        <>
          <EditObjectiveDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            objective={selectedObjective}
            onSuccess={fetchObjectives}
          />
          <DuplicateObjectiveDialog
            open={duplicateDialogOpen}
            onOpenChange={setDuplicateDialogOpen}
            objective={selectedObjective}
            onSuccess={fetchObjectives}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("indicators.management.deleteObjective")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("indicators.management.confirmDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
