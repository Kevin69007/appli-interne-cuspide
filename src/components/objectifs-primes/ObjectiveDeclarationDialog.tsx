import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileCheck } from "lucide-react";

interface Objective {
  id: string;
  date: string;
  detail: string;
  valeur_declaree: number | null;
}

interface Props {
  employeeId: string;
}

export const ObjectiveDeclarationDialog = ({ employeeId }: Props) => {
  const [open, setOpen] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("");
  const [valeurDeclaree, setValeurDeclaree] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (open) {
      fetchObjectives();
    }
  }, [open, employeeId]);

  const fetchObjectives = async () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('agenda_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('categorie', 'indicateurs' as any)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .is('valeur_declaree', null);

    if (error) {
      console.error('Error fetching objectives:', error);
      return;
    }

    setObjectives(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedObjectiveId || !valeurDeclaree) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('agenda_entries')
        .update({
          valeur_declaree: parseFloat(valeurDeclaree),
          commentaire_validation: commentaire || null,
          statut_validation: 'en_attente'
        })
        .eq('id', selectedObjectiveId);

      if (error) throw error;

      toast.success("Indicateur déclaré avec succès ! En attente de validation.");
      setOpen(false);
      setSelectedObjectiveId("");
      setValeurDeclaree("");
      setCommentaire("");
    } catch (error) {
      console.error('Error declaring objective:', error);
      toast.error("Erreur lors de la déclaration de l'indicateur");
    } finally {
      setLoading(false);
    }
  };

  const selectedObjective = objectives.find(obj => obj.id === selectedObjectiveId);
  let objectiveData: any = null;
  if (selectedObjective?.detail) {
    try {
      const parsed = JSON.parse(selectedObjective.detail);
      objectiveData = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      objectiveData = null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <FileCheck className="h-4 w-4 mr-2" />
          Déclarer un indicateur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Déclarer un indicateur atteint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Indicateur à déclarer</Label>
            <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un objectif" />
              </SelectTrigger>
              <SelectContent>
                {objectives.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Aucun objectif à déclarer
                  </div>
                ) : (
                  objectives.map((obj) => {
                    let objData: any = null;
                    try {
                      const parsed = JSON.parse(obj.detail);
                      objData = Array.isArray(parsed) ? parsed[0] : parsed;
                    } catch (e) {
                      objData = null;
                    }
                    return (
                      <SelectItem key={obj.id} value={obj.id}>
                        {objData?.nom || obj.detail} - {new Date(obj.date).toLocaleDateString('fr-FR')}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {objectiveData && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p><strong>Objectif :</strong> {objectiveData.nom}</p>
              <p><strong>Valeur cible :</strong> {objectiveData.valeur_cible} {objectiveData.indicateur}</p>
            </div>
          )}

          <div>
            <Label>Valeur réalisée *</Label>
            <Input
              type="number"
              step="0.01"
              value={valeurDeclaree}
              onChange={(e) => setValeurDeclaree(e.target.value)}
              placeholder={objectiveData ? `Ex: ${objectiveData.valeur_cible}` : "Entrer la valeur"}
              required
            />
          </div>

          <div>
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !selectedObjectiveId || !valeurDeclaree} className="flex-1">
              {loading ? "Envoi..." : "Déclarer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
