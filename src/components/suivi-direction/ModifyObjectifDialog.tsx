import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModifyObjectifDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectif: any;
  onSuccess: () => void;
}

export const ModifyObjectifDialog = ({ open, onOpenChange, objectif, onSuccess }: ModifyObjectifDialogProps) => {
  const [valeurCible, setValeurCible] = useState("");
  const [valeurRealisee, setValeurRealisee] = useState("");
  const [raison, setRaison] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (objectif) {
      setValeurCible(objectif.valeur_cible?.toString() || "");
      setValeurRealisee(objectif.valeur_realisee?.toString() || "");
      setRaison("");
    }
  }, [objectif]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valeurCible || !raison) {
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

      const ancienneValeur = objectif.valeur_cible;
      const nouvelleValeur = parseFloat(valeurCible);
      const ecartPourcentage = Math.abs(((nouvelleValeur - ancienneValeur) / ancienneValeur) * 100);

      // Enregistrer la modification dans l'historique
      const { error: historyError } = await supabase
        .from("objectifs_modifications")
        .insert({
          objectif_id: objectif.id,
          ancienne_valeur: ancienneValeur,
          nouvelle_valeur: nouvelleValeur,
          modifie_par: employeeData?.id,
          raison
        });

      if (historyError) throw historyError;

      // Mettre à jour l'objectif
      const { error } = await supabase
        .from("objectifs_individuels")
        .update({
          valeur_cible: nouvelleValeur,
          valeur_realisee: valeurRealisee ? parseFloat(valeurRealisee) : null,
          modifie_par: employeeData?.id,
          raison_modification: raison,
          statut: "modifie"
        })
        .eq("id", objectif.id);

      if (error) throw error;

      // Appliquer une pénalité si l'écart est significatif (> 10%)
      if (ecartPourcentage > 10) {
        // Créer une notification pour l'employé
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            employee_id: objectif.employee_id,
            type: "malus",
            titre: "Objectif corrigé",
            message: `Votre objectif "${objectif.nom}" a été corrigé par un manager. Un malus a été appliqué en raison de l'écart important (${ecartPourcentage.toFixed(1)}%).`,
            url: "/objectifs-primes/employe"
          });

        if (notifError) {
          console.error("Erreur notification:", notifError);
        }

        toast.success(`Objectif modifié avec pénalité appliquée (écart: ${ecartPourcentage.toFixed(1)}%)`);
      } else {
        toast.success("Objectif modifié avec succès");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'objectif</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cible">Nouvelle valeur cible *</Label>
            <Input
              id="cible"
              type="number"
              step="0.01"
              value={valeurCible}
              onChange={(e) => setValeurCible(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Ancienne valeur : {objectif.valeur_cible} {objectif.unite}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="realisee">Valeur réalisée</Label>
            <Input
              id="realisee"
              type="number"
              step="0.01"
              value={valeurRealisee}
              onChange={(e) => setValeurRealisee(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="raison">Raison de la modification *</Label>
            <Textarea
              id="raison"
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Expliquez pourquoi l'objectif est modifié..."
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Modifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
