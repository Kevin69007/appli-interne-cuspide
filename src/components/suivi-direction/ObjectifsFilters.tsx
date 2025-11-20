import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface ObjectifsFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  objectifs: any[];
}

export interface FilterValues {
  employeeId: string;
  startDate: string;
  endDate: string;
  typePeriode: string;
  statut: string;
}

export const ObjectifsFilters = ({ onFilterChange, objectifs }: ObjectifsFiltersProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    employeeId: "all",
    startDate: "",
    endDate: "",
    typePeriode: "all",
    statut: "all"
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nom, prenom")
        .order("nom");
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Erreur chargement employés:", error);
    }
  };

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: FilterValues = {
      employeeId: "all",
      startDate: "",
      endDate: "",
      typePeriode: "all",
      statut: "all"
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const handleExportPDF = () => {
    if (objectifs.length === 0) {
      toast.error("Aucun indicateur à exporter");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête
      doc.setFontSize(18);
      doc.text("Rapport - Indicateurs Individuels", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      const periodText = filters.startDate && filters.endDate
        ? `Période: ${format(new Date(filters.startDate), "dd/MM/yyyy", { locale: fr })} - ${format(new Date(filters.endDate), "dd/MM/yyyy", { locale: fr })}`
        : "Période: Toutes";
      doc.text(periodText, pageWidth / 2, 28, { align: "center" });
      
      // Tableau
      let y = 40;
      doc.setFontSize(9);
      
      // En-têtes
      doc.setFont(undefined, "bold");
      doc.text("Employé", 10, y);
      doc.text("Indicateur", 50, y);
      doc.text("Type", 100, y);
      doc.text("Cible", 130, y);
      doc.text("Réalisé", 160, y);
      doc.text("Statut", 185, y);
      
      y += 7;
      doc.setFont(undefined, "normal");
      
      // Données
      objectifs.forEach((obj) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        const employeName = `${obj.employee.prenom} ${obj.employee.nom}`;
        const typePeriode = obj.type_periode === "daily" ? "J" : obj.type_periode === "weekly" ? "H" : "M";
        const cible = `${obj.valeur_cible} ${obj.unite || ""}`;
        const realise = obj.valeur_realisee !== null ? `${obj.valeur_realisee} ${obj.unite || ""}` : "-";
        const statut = obj.statut === "en_cours" ? "En cours" : obj.statut === "termine" ? "Terminé" : "Modifié";
        
        doc.text(employeName.substring(0, 20), 10, y);
        doc.text(obj.nom.substring(0, 25), 50, y);
        doc.text(typePeriode, 100, y);
        doc.text(cible.substring(0, 15), 130, y);
        doc.text(realise.substring(0, 15), 160, y);
        doc.text(statut, 185, y);
        
        y += 6;
      });
      
      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Exporté le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })} - Page ${i}/${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
      
      doc.save(`indicateurs-individuels-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Export PDF réussi");
    } catch (error) {
      console.error("Erreur export PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employee-filter">Employé</Label>
          <Select value={filters.employeeId} onValueChange={(v) => handleFilterChange("employeeId", v)}>
            <SelectTrigger id="employee-filter">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start-date">Date début</Label>
          <Input
            id="start-date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">Date fin</Label>
          <Input
            id="end-date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type-filter">Type</Label>
          <Select value={filters.typePeriode} onValueChange={(v) => handleFilterChange("typePeriode", v)}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="daily">Journalier</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="statut-filter">Statut</Label>
          <Select value={filters.statut} onValueChange={(v) => handleFilterChange("statut", v)}>
            <SelectTrigger id="statut-filter">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="termine">Terminé</SelectItem>
              <SelectItem value="modifie">Modifié</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <X className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <Button variant="default" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>
      </div>
    </div>
  );
};
