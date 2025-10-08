import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onEventAdded?: () => void;
}

export const AddEventDialog = ({ open, onOpenChange, selectedDate, onEventAdded }: AddEventDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { isAdmin, isManager } = useUserRole();
  
  const [formData, setFormData] = useState({
    employee_id: "",
    categorie: "",
    type_incident: "",
    type_absence: "",
    gravite: "",
    detail: "",
    points: 0
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("agenda_entries")
        .insert([{
          employee_id: formData.employee_id,
          date: selectedDate.toISOString().split('T')[0],
          categorie: formData.categorie as any,
          type_incident: formData.type_incident as any || null,
          type_absence: formData.type_absence as any || null,
          gravite: formData.gravite as any || null,
          detail: formData.detail,
          points: formData.points,
          statut_validation: formData.categorie === 'absence' && formData.type_absence === 'demande_conges' ? 'en_attente' : 'valide'
        }]);

      if (error) throw error;

      toast.success("L'événement a été ajouté avec succès.");

      setFormData({ employee_id: "", categorie: "", type_incident: "", type_absence: "", gravite: "", detail: "", points: 0 });
      onOpenChange(false);
      onEventAdded?.();
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Impossible d'ajouter l'événement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Ajouter un événement - {selectedDate.toLocaleDateString('fr-FR')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee">Employé</Label>
            <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
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

          <div>
            <Label htmlFor="categorie">Type d'événement</Label>
            <Select value={formData.categorie} onValueChange={(v) => setFormData({ ...formData, categorie: v, type_incident: "", type_absence: "" })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="absence">Absence</SelectItem>
                <SelectItem value="a_faire">À faire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.categorie === "incident" && (
            <>
              <div>
                <Label htmlFor="type_incident">Type d'incident</Label>
                <Select value={formData.type_incident} onValueChange={(v) => setFormData({ ...formData, type_incident: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retard">Retard</SelectItem>
                    <SelectItem value="negligence">Négligence</SelectItem>
                    <SelectItem value="erreur_protocole">Erreur protocole</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gravite">Gravité</Label>
                <Select value={formData.gravite} onValueChange={(v) => setFormData({ ...formData, gravite: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mineure">Mineure</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="majeure">Majeure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formData.categorie === "absence" && (
            <div>
              <Label htmlFor="type_absence">Type d'absence</Label>
              <Select value={formData.type_absence} onValueChange={(v) => setFormData({ ...formData, type_absence: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demande_conges">Demande de congés</SelectItem>
                  {(isAdmin || isManager) && (
                    <>
                      <SelectItem value="arret_maladie">Arrêt maladie</SelectItem>
                      <SelectItem value="injustifie">Injustifié</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="detail">Détails</Label>
            <Input
              id="detail"
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              placeholder="Description de l'événement"
            />
          </div>

          <div>
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.employee_id || !formData.categorie}>
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
