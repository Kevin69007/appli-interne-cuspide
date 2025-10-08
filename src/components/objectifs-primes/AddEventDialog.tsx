import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

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
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const { isAdmin, isManager } = useUserRole();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    employee_id: "",
    categorie: "",
    type_incident: "",
    type_absence: "",
    gravite: "",
    detail: "",
    points: 0,
    date_debut: "",
    date_fin: "",
    titre: "",
    priorite: "normale"
  });

  useEffect(() => {
    fetchEmployees();
    fetchCurrentEmployee();
  }, [user]);

  const fetchCurrentEmployee = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setCurrentEmployeeId(data.id);
    }
  };

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
      // Si c'est une tâche ("À faire"), créer dans la table tasks
      if (formData.categorie === 'a_faire') {
        if (!formData.titre) {
          toast.error("Le titre est requis pour une tâche.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.from("tasks").insert([{
          titre: formData.titre,
          description: formData.detail,
          created_by: currentEmployeeId,
          assigned_to: formData.employee_id,
          date_echeance: selectedDate.toISOString().split('T')[0],
          priorite: formData.priorite,
          statut: "en_cours",
        }]);

        if (error) throw error;

        // Créer une notification
        if (formData.employee_id !== currentEmployeeId) {
          await supabase.from("notifications").insert([{
            employee_id: formData.employee_id,
            titre: "Nouvelle tâche assignée",
            message: `Vous avez été assigné à la tâche : ${formData.titre}`,
            type: "task_assigned",
            url: "/taches",
          }]);
        }

        toast.success("La tâche a été créée avec succès.");
      } else {
        // Sinon, créer un événement d'agenda normal
        let dureeMinutes = null;
        let detailText = formData.detail;

        if (formData.categorie === 'absence' && formData.type_absence === 'demande_conges') {
          if (!formData.date_debut || !formData.date_fin) {
            toast.error("Veuillez sélectionner les dates de début et de fin.");
            setLoading(false);
            return;
          }

          const dateDebut = new Date(formData.date_debut);
          const dateFin = new Date(formData.date_fin);
          
          if (dateFin < dateDebut) {
            toast.error("La date de fin doit être après la date de début.");
            setLoading(false);
            return;
          }

          let workDays = 0;
          const currentDate = new Date(dateDebut);
          while (currentDate <= dateFin) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              workDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }

          dureeMinutes = workDays * 8 * 60;
          detailText = `Du ${dateDebut.toLocaleDateString('fr-FR')} au ${dateFin.toLocaleDateString('fr-FR')}${formData.detail ? ' - ' + formData.detail : ''}`;
        }

        const { error } = await supabase
          .from("agenda_entries")
          .insert([{
            employee_id: formData.employee_id,
            date: formData.categorie === 'absence' && formData.type_absence === 'demande_conges' 
              ? formData.date_debut 
              : selectedDate.toISOString().split('T')[0],
            categorie: formData.categorie as any,
            type_incident: formData.type_incident as any || null,
            type_absence: formData.type_absence as any || null,
            gravite: formData.gravite as any || null,
            detail: detailText,
            points: formData.points,
            duree_minutes: dureeMinutes,
            statut_validation: formData.categorie === 'absence' && formData.type_absence === 'demande_conges' ? 'en_attente' : 'valide'
          }]);

        if (error) throw error;

        toast.success("L'événement a été ajouté avec succès.");
      }

      setFormData({ 
        employee_id: "", 
        categorie: "", 
        type_incident: "", 
        type_absence: "", 
        gravite: "", 
        detail: "", 
        points: 0, 
        date_debut: "", 
        date_fin: "",
        titre: "",
        priorite: "normale"
      });
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

          {formData.categorie === "a_faire" && (
            <div>
              <Label htmlFor="titre">Titre de la tâche *</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder="Titre de la tâche"
                required
              />
            </div>
          )}

          {formData.categorie === "a_faire" && (
            <div>
              <Label htmlFor="priorite">Priorité</Label>
              <Select value={formData.priorite} onValueChange={(v) => setFormData({ ...formData, priorite: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.categorie === "absence" && (
            <>
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

              {formData.type_absence === "demande_conges" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_debut">Date de début</Label>
                    <Input
                      id="date_debut"
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_fin">Date de fin</Label>
                    <Input
                      id="date_fin"
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {(formData.categorie === "a_faire" || formData.type_absence !== "demande_conges") && formData.categorie !== "" && (
            <div>
              <Label htmlFor="detail">{formData.categorie === "a_faire" ? "Description" : "Détails"}</Label>
              <Input
                id="detail"
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                placeholder={formData.categorie === "a_faire" ? "Description de la tâche" : "Description de l'événement"}
              />
            </div>
          )}

          {formData.type_absence === "demande_conges" && (
            <div>
              <Label htmlFor="detail">Motif (optionnel)</Label>
              <Input
                id="detail"
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                placeholder="Motif de la demande"
              />
            </div>
          )}

          {formData.categorie !== "a_faire" && (
            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                !formData.employee_id || 
                !formData.categorie ||
                (formData.categorie === 'a_faire' && !formData.titre) ||
                (formData.categorie === 'incident' && !formData.type_incident) ||
                (formData.categorie === 'absence' && !formData.type_absence)
              }
            >
              {loading ? "Ajout..." : formData.categorie === 'a_faire' ? "Créer la tâche" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
