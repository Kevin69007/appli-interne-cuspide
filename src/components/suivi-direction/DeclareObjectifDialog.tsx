import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths, startOfDay } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";

interface DeclareObjectifDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

export const DeclareObjectifDialog = ({ open, onOpenChange, onSuccess }: DeclareObjectifDialogProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [nom, setNom] = useState("");
  const [typePeriode, setTypePeriode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [valeurCible, setValeurCible] = useState("");
  const [valeurRealisee, setValeurRealisee] = useState("");
  const [unite, setUnite] = useState("");
  const [periodeDebut, setPeriodeDebut] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const { isAdmin, isManager } = useUserRole();

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchCurrentEmployeeId();
    }
  }, [open]);

  const fetchEmployees = async () => {
    if (!isAdmin && !isManager) return;
    
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nom, prenom")
        .order("nom");
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des employés");
    }
  };

  const fetchCurrentEmployeeId = async () => {
    if (isAdmin || isManager) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", userData.user?.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setSelectedEmployeeId(data.id);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const calculatePeriodeFin = (debut: string, type: string): string => {
    const startDate = new Date(debut);
    switch (type) {
      case "daily":
        return format(startDate, "yyyy-MM-dd");
      case "weekly":
        return format(addDays(startDate, 6), "yyyy-MM-dd");
      case "monthly":
        return format(addMonths(startDate, 1), "yyyy-MM-dd");
      default:
        return debut;
    }
  };

  const canDeclareForDate = (date: string, type: string): boolean => {
    if (type !== "daily") return true;
    
    const selectedDate = startOfDay(new Date(date));
    const today = startOfDay(new Date());
    
    return selectedDate <= today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId || !nom || !valeurCible) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!canDeclareForDate(periodeDebut, typePeriode)) {
      toast.error("Pour un indicateur journalier, vous ne pouvez déclarer que pour aujourd'hui ou un jour passé");
      return;
    }

    try {
      setLoading(true);
      
      const periodeFin = calculatePeriodeFin(periodeDebut, typePeriode);

      const { error } = await supabase
        .from("objectifs_individuels")
        .insert({
          employee_id: selectedEmployeeId,
          nom,
          type_periode: typePeriode,
          valeur_cible: parseFloat(valeurCible),
          valeur_realisee: valeurRealisee ? parseFloat(valeurRealisee) : null,
          unite: unite || null,
          periode_debut: periodeDebut,
          periode_fin: periodeFin,
          statut: "en_cours"
        });

      if (error) throw error;

      toast.success("Indicateur déclaré avec succès");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error("Erreur lors de la déclaration");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployeeId("");
    setNom("");
    setTypePeriode("daily");
    setValeurCible("");
    setValeurRealisee("");
    setUnite("");
    setPeriodeDebut(format(new Date(), "yyyy-MM-dd"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Déclarer un Indicateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(isAdmin || isManager) && (
            <div className="space-y-2">
              <Label htmlFor="employee">Employé *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.prenom} {emp.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nom">Nom de l'indicateur *</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Nombre de pièces produites"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de période *</Label>
            <Select value={typePeriode} onValueChange={(v: any) => setTypePeriode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Journalier</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debut">Date de début *</Label>
            <Input
              id="debut"
              type="date"
              value={periodeDebut}
              onChange={(e) => setPeriodeDebut(e.target.value)}
              max={typePeriode === "daily" ? format(new Date(), "yyyy-MM-dd") : undefined}
              required
            />
            {typePeriode === "daily" && (
              <p className="text-xs text-muted-foreground">
                Pour un indicateur journalier, vous ne pouvez déclarer que pour aujourd'hui ou un jour passé
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cible">Valeur cible *</Label>
              <Input
                id="cible"
                type="number"
                step="0.01"
                value={valeurCible}
                onChange={(e) => setValeurCible(e.target.value)}
                placeholder="Ex: 100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unite">Unité</Label>
              <Input
                id="unite"
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
                placeholder="Ex: pièces"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="realisee">Valeur réalisée (optionnel)</Label>
            <Input
              id="realisee"
              type="number"
              step="0.01"
              value={valeurRealisee}
              onChange={(e) => setValeurRealisee(e.target.value)}
              placeholder="Ex: 95"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Déclarer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
