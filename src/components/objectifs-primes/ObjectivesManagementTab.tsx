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
import { Edit, Copy, Trash2, Search, Filter, X } from "lucide-react";
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
  id: string;
  employee_id: string;
  employee_name: string;
  indicator_name: string;
  recurrence: string;
  target_value: number;
  points: number;
  unit: string;
  date: string;
  status: string;
}

export const ObjectivesManagementTab = () => {
  const { t } = useTranslation('indicators');
  const [objectives, setObjectives] = useState<ObjectiveGroup[]>([]);
  const [filteredObjectives, setFilteredObjectives] = useState<ObjectiveGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempSelectedEmployee, setTempSelectedEmployee] = useState<string>("all");
  const [tempSelectedRecurrence, setTempSelectedRecurrence] = useState<string>("all");
  const [tempSelectedStatus, setTempSelectedStatus] = useState<string>("all");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  
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

      const objectivesList: ObjectiveGroup[] = entries?.map((entry: any) => {
        const detail = entry.detail ? JSON.parse(entry.detail) : {};
        return {
          id: entry.id,
          employee_id: entry.employee_id,
          employee_name: entry.employees 
            ? `${entry.employees.prenom} ${entry.employees.nom}` 
            : "Inconnu",
          indicator_name: detail.nom || entry.type || "Sans nom",
          recurrence: detail.recurrence || "mois",
          target_value: detail.valeur_cible || 0,
          points: entry.points_indicateur || 0,
          unit: detail.unite || "",
          date: entry.date,
          status: entry.statut_objectif || "en_attente",
        };
      }) || [];

      setObjectives(objectivesList);
    } catch (error) {
      console.error("Error fetching objectives:", error);
      toast.error("Erreur lors du chargement des indicateurs");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = objectives;

    if (searchTerm) {
      filtered = filtered.filter(obj =>
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
      filtered = filtered.filter(obj => obj.status === selectedStatus);
    }

    setFilteredObjectives(filtered);
  };

  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setSelectedEmployee(tempSelectedEmployee);
    setSelectedRecurrence(tempSelectedRecurrence);
    setSelectedStatus(tempSelectedStatus);
    
    let count = 0;
    if (tempSearchTerm) count++;
    if (tempSelectedEmployee !== "all") count++;
    if (tempSelectedRecurrence !== "all") count++;
    if (tempSelectedStatus !== "all") count++;
    setAppliedFiltersCount(count);
  };

  const handleResetFilters = () => {
    setTempSearchTerm("");
    setTempSelectedEmployee("all");
    setTempSelectedRecurrence("all");
    setTempSelectedStatus("all");
    setSearchTerm("");
    setSelectedEmployee("all");
    setSelectedRecurrence("all");
    setSelectedStatus("all");
    setAppliedFiltersCount(0);
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
    setSelectedObjective(objective);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedObjective) return;

    try {
      const { error } = await supabase
        .from("agenda_entries")
        .delete()
        .eq("id", selectedObjective.id);

      if (error) throw error;

      await supabase.from("audit_log").insert([{
        table_name: "agenda_entries",
        action: "delete",
        record_id: selectedObjective.id,
        ancien_contenu: selectedObjective as any,
      }]);

      toast.success(t("management.deleteSuccess"));
      fetchObjectives();
    } catch (error) {
      console.error("Error deleting objective:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedObjective(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">{t("management.loadingObjectives")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t("management.filters")}</h3>
          {appliedFiltersCount > 0 && (
            <Badge variant="secondary">
              {t("management.activeFilters", { count: appliedFiltersCount })}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("management.searchPlaceholder")}
              value={tempSearchTerm}
              onChange={(e) => setTempSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={tempSelectedEmployee} onValueChange={setTempSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder={t("management.allEmployees")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("management.allEmployees")}</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tempSelectedRecurrence} onValueChange={setTempSelectedRecurrence}>
            <SelectTrigger>
              <SelectValue placeholder={t("management.allRecurrences")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("management.allRecurrences")}</SelectItem>
              <SelectItem value="jour">Jour</SelectItem>
              <SelectItem value="semaine">Semaine</SelectItem>
              <SelectItem value="mois">Mois</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="annee">Année</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tempSelectedStatus} onValueChange={setTempSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder={t("management.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("management.allStatuses")}</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="valide">Validé</SelectItem>
              <SelectItem value="rejete">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApplyFilters}>
            <Search className="h-4 w-4 mr-2" />
            {t("management.applyFilters")}
          </Button>
          <Button variant="outline" onClick={handleResetFilters}>
            <X className="h-4 w-4 mr-2" />
            {t("management.resetFilters")}
          </Button>
        </div>
      </Card>

      {filteredObjectives.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t("management.noObjectives")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("management.employee")}</TableHead>
              <TableHead>{t("management.indicatorName")}</TableHead>
              <TableHead>{t("management.recurrence")}</TableHead>
              <TableHead>{t("management.date")}</TableHead>
              <TableHead>{t("management.targetValue")}</TableHead>
              <TableHead>{t("management.points")}</TableHead>
              <TableHead>{t("management.status")}</TableHead>
              <TableHead className="text-right">{t("management.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredObjectives.map((obj) => (
              <TableRow key={obj.id}>
                <TableCell>{obj.employee_name}</TableCell>
                <TableCell className="font-medium">{obj.indicator_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{obj.recurrence}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(obj.date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  {obj.target_value} {obj.unit}
                </TableCell>
                <TableCell>
                  <Badge>{obj.points} pts</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={obj.status === "valide" ? "default" : obj.status === "rejete" ? "destructive" : "secondary"}>
                    {obj.status === "valide" ? "Validé" : obj.status === "rejete" ? "Rejeté" : "En attente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(obj)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(obj)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(obj)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedObjective && (
        <>
          <EditObjectiveDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            objective={selectedObjective as any}
            onSuccess={fetchObjectives}
          />
          <DuplicateObjectiveDialog
            open={duplicateDialogOpen}
            onOpenChange={setDuplicateDialogOpen}
            objective={selectedObjective as any}
            onSuccess={fetchObjectives}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("management.deleteObjective")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("management.confirmDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
