import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

export const CreateKPIDialog = ({ open, onOpenChange, onSuccess }: CreateKPIDialogProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [typeDonnee, setTypeDonnee] = useState<"number" | "percentage" | "currency" | "integer">("number");
  const [responsableId, setResponsableId] = useState("");
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nom || !responsableId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const { data: employeeData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", userData.user?.id)
        .single();

      const { error } = await supabase
        .from("kpi_definitions")
        .insert({
          nom,
          description: description || null,
          type_donnee: typeDonnee,
          responsable_id: responsableId,
          recurrence,
          created_by: employeeData?.id
        });

      if (error) throw error;

      toast.success("KPI créé avec succès");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error("Erreur lors de la création");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNom("");
    setDescription("");
    setTypeDonnee("number");
    setResponsableId("");
    setRecurrence("monthly");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau KPI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du KPI *</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Chiffre d'affaires mensuel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du KPI..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de données *</Label>
            <Select value={typeDonnee} onValueChange={(v: any) => setTypeDonnee(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Nombre décimal</SelectItem>
                <SelectItem value="integer">Nombre entier</SelectItem>
                <SelectItem value="percentage">Pourcentage</SelectItem>
                <SelectItem value="currency">Devise (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable de la saisie *</Label>
            <Select value={responsableId} onValueChange={setResponsableId}>
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

          <div className="space-y-2">
            <Label htmlFor="recurrence">Récurrence de saisie *</Label>
            <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
