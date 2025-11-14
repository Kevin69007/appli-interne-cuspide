import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Objective {
  nom: string;
  valeur_cible: number;
  indicateur: string;
  recurrence: "jour" | "semaine" | "mois";
  points_indicateur: number;
}

interface CreateObjectiveDialogProps {
  onObjectiveCreated: (objective: Objective) => void;
  totalPointsConfig: number;
  currentTotal: number;
}

export const CreateObjectiveDialog = ({ onObjectiveCreated, totalPointsConfig, currentTotal }: CreateObjectiveDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    valeur_cible: 0,
    indicateur: "",
    recurrence: "mois" as "jour" | "semaine" | "mois",
    points_indicateur: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.points_indicateur === 0) {
      return;
    }
    
    if (currentTotal + formData.points_indicateur > totalPointsConfig) {
      return;
    }
    
    onObjectiveCreated(formData);
    setFormData({ nom: "", valeur_cible: 0, indicateur: "", recurrence: "mois", points_indicateur: 0 });
    setOpen(false);
  };

  const pointsRemaining = totalPointsConfig - currentTotal;
  const isOverLimit = formData.points_indicateur > pointsRemaining;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Créer indicateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un nouvel indicateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom de l'indicateur</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Nombre de pièces produites"
              required
            />
          </div>

          <div>
            <Label htmlFor="valeur">Valeur cible</Label>
            <Input
              id="valeur"
              type="number"
              value={formData.valeur_cible}
              onChange={(e) => setFormData({ ...formData, valeur_cible: parseInt(e.target.value) || 0 })}
              placeholder="Ex: 100"
              required
            />
          </div>

          <div>
            <Label htmlFor="indicateur">Indicateur de mesure</Label>
            <Input
              id="indicateur"
              value={formData.indicateur}
              onChange={(e) => setFormData({ ...formData, indicateur: e.target.value })}
              placeholder="Ex: pièces, %, heures..."
              required
            />
          </div>

          <div>
            <Label htmlFor="recurrence">Récurrence</Label>
            <Select value={formData.recurrence} onValueChange={(v: any) => setFormData({ ...formData, recurrence: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jour">Quotidien (du lundi au vendredi)</SelectItem>
                <SelectItem value="semaine">Hebdomadaire (chaque vendredi)</SelectItem>
                <SelectItem value="mois">Mensuel (dernier jour du mois)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="points">Points indicateur *</Label>
            <Input
              id="points"
              type="number"
              min="0"
              max={pointsRemaining}
              value={formData.points_indicateur}
              onChange={(e) => setFormData({ ...formData, points_indicateur: parseInt(e.target.value) || 0 })}
              placeholder={`Ex: ${Math.min(10, pointsRemaining)}`}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Points restants: {pointsRemaining} / {totalPointsConfig}
            </p>
            {isOverLimit && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ Dépassement de {formData.points_indicateur - pointsRemaining} pts
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isOverLimit || formData.points_indicateur === 0}>
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
