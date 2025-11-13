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

interface Indicator {
  id: string;
  date: string;
  detail: string;
  valeur_declaree: number | null;
}

interface Props {
  employeeId: string;
}

export const IndicatorDeclarationDialog = ({ employeeId }: Props) => {
  const [open, setOpen] = useState(false);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState("");
  const [valeurDeclaree, setValeurDeclaree] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJustification, setShowJustification] = useState(false);
  const [raisonEcart, setRaisonEcart] = useState<string>("");
  const [detailProbleme, setDetailProbleme] = useState("");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (open) {
      fetchIndicators();
    }
  }, [open, employeeId]);

  const fetchIndicators = async () => {
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
      console.error('Error fetching indicators:', error);
      return;
    }

    setIndicators(data || []);
  };

  const handleValeurChange = (value: string) => {
    setValeurDeclaree(value);
    
    const indicator = indicators.find(ind => ind.id === selectedIndicatorId);
    if (indicator) {
      try {
        const parsed = JSON.parse(indicator.detail);
        const indicatorData = Array.isArray(parsed) ? parsed[0] : parsed;
        const valeurCible = indicatorData.valeur_cible;
        const valeurSaisie = parseFloat(value);
        
        if (!isNaN(valeurSaisie) && valeurCible > 0) {
          const ecart = ((valeurCible - valeurSaisie) / valeurCible) * 100;
          setShowJustification(ecart > 20);
        }
      } catch (e) {
        setShowJustification(false);
      }
    }
  };

  const notifyManager = async (reason: string, details?: string) => {
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('equipe')
        .eq('id', employeeId)
        .single();
        
      if (!employee) return;

      const { data: managers } = await supabase
        .from('employees')
        .select('id, user_id')
        .eq('equipe', employee.equipe);

      if (!managers) return;

      const managerIds = managers
        .filter(m => m.user_id)
        .map(m => m.id);

      if (managerIds.length === 0) return;

      const notifications = managerIds.map(managerId => ({
        employee_id: managerId,
        type: reason === 'volume_travail_insuffisant' ? 'info' : 'warning',
        titre: reason === 'volume_travail_insuffisant' 
          ? 'Demande de tâches complémentaires'
          : 'Problème exceptionnel signalé',
        message: reason === 'volume_travail_insuffisant'
          ? `Un employé indique avoir besoin de tâches complémentaires.`
          : `Problème signalé : ${details}`,
        url: '/objectifs-primes/admin'
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Error notifying manager:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIndicatorId || !valeurDeclaree) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (showJustification) {
      if (!raisonEcart) {
        toast.error("Veuillez sélectionner une raison pour l'écart");
        return;
      }
      
      if (raisonEcart === 'probleme_exceptionnel' && detailProbleme.length < 10) {
        toast.error("Veuillez détailler le problème (minimum 10 caractères)");
        return;
      }
    }

    setLoading(true);

    try {
      const updateData: any = {
        valeur_declaree: parseFloat(valeurDeclaree),
        commentaire_validation: commentaire || null,
        statut_validation: 'en_attente'
      };

      if (showJustification) {
        updateData.raison_ecart = raisonEcart;
        updateData.detail_probleme = raisonEcart === 'probleme_exceptionnel' ? detailProbleme : null;
        
        if (raisonEcart === 'volume_travail_insuffisant' || raisonEcart === 'probleme_exceptionnel') {
          await notifyManager(raisonEcart, detailProbleme);
          updateData.manager_notifie = true;
        }
      }

      const { error } = await supabase
        .from('agenda_entries')
        .update(updateData)
        .eq('id', selectedIndicatorId);

      if (error) throw error;

      toast.success("Indicateur déclaré avec succès ! En attente de validation.");
      setOpen(false);
      setSelectedIndicatorId("");
      setValeurDeclaree("");
      setCommentaire("");
      setRaisonEcart("");
      setDetailProbleme("");
      setShowJustification(false);
    } catch (error) {
      console.error('Error declaring indicator:', error);
      toast.error("Erreur lors de la déclaration de l'indicateur");
    } finally {
      setLoading(false);
    }
  };

  const selectedIndicator = indicators.find(ind => ind.id === selectedIndicatorId);
  let indicatorData: any = null;
  if (selectedIndicator?.detail) {
    try {
      const parsed = JSON.parse(selectedIndicator.detail);
      indicatorData = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      indicatorData = null;
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
            <Select value={selectedIndicatorId} onValueChange={setSelectedIndicatorId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un indicateur" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((indicator) => {
                  let objectName = "";
                  try {
                    const parsed = JSON.parse(indicator.detail);
                    const objData = Array.isArray(parsed) ? parsed[0] : parsed;
                    objectName = objData.nom || "Indicateur";
                  } catch (e) {
                    objectName = "Indicateur";
                  }
                  return (
                    <SelectItem key={indicator.id} value={indicator.id}>
                      {objectName} - {new Date(indicator.date).toLocaleDateString('fr-FR')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedIndicator && indicatorData && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">Détails de l'indicateur</h4>
              <p className="text-sm">
                <strong>Indicateur :</strong> {indicatorData.nom}
              </p>
              <p className="text-sm">
                <strong>Valeur cible :</strong> {indicatorData.valeur_cible} {indicatorData.indicateur}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="valeur">Valeur déclarée *</Label>
            <Input
              id="valeur"
              type="number"
              step="0.01"
              value={valeurDeclaree}
              onChange={(e) => handleValeurChange(e.target.value)}
              placeholder="Entrez la valeur atteinte"
              required
            />
          </div>

          {showJustification && (
            <div className="space-y-3 border-l-4 border-orange-500 pl-4 py-2 bg-orange-50">
              <Label className="text-orange-700">
                ⚠️ Votre valeur est inférieure de plus de 20% à la cible. Veuillez justifier :
              </Label>
              <Select value={raisonEcart} onValueChange={setRaisonEcart}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicateur_trop_eleve">Indicateur trop élevé</SelectItem>
                  <SelectItem value="volume_travail_insuffisant">Volume de travail insuffisant</SelectItem>
                  <SelectItem value="probleme_exceptionnel">Problème exceptionnel</SelectItem>
                </SelectContent>
              </Select>
              
              {raisonEcart === 'volume_travail_insuffisant' && (
                <p className="text-sm text-blue-600 italic">
                  ℹ️ Votre manager sera informé que vous avez besoin de tâches complémentaires.
                </p>
              )}
              
              {raisonEcart === 'probleme_exceptionnel' && (
                <div className="space-y-2">
                  <Label>Détaillez le problème (minimum 10 caractères) *</Label>
                  <Textarea
                    value={detailProbleme}
                    onChange={(e) => setDetailProbleme(e.target.value)}
                    placeholder="Décrivez le problème rencontré..."
                    minLength={10}
                    required
                  />
                  <p className="text-sm text-blue-600 italic">
                    ℹ️ Votre manager sera informé de ce problème.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajoutez un commentaire si nécessaire"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Déclaration..." : "Déclarer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Keep old export for backwards compatibility temporarily
export { IndicatorDeclarationDialog as ObjectiveDeclarationDialog };
