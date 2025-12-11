import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateCommunicationDialog = ({ open, onOpenChange, onSuccess }: CreateCommunicationDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    type_destinataire: "tout_le_monde",
    equipes: [] as string[],
    groupes: [] as string[],
    require_confirmation: false,
    show_in_calendar: false,
    date_expiration: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const insertData: any = {
        titre: formData.titre,
        contenu: formData.contenu,
        type_destinataire: formData.type_destinataire,
        equipes: formData.equipes.length > 0 ? formData.equipes : null,
        groupes: formData.groupes.length > 0 ? formData.groupes : null,
        require_confirmation: formData.require_confirmation,
        show_in_calendar: formData.show_in_calendar,
        date_expiration: formData.date_expiration || null,
        created_by: user.id
      };

      const { error } = await supabase
        .from("communications")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Communication créée",
        description: "La communication a été envoyée avec succès"
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        titre: "",
        contenu: "",
        type_destinataire: "tout_le_monde",
        equipes: [],
        groupes: [],
        require_confirmation: false,
        show_in_calendar: false,
        date_expiration: ""
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la communication",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Nouvelle Communication</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="contenu">Message *</Label>
            <Textarea
              id="contenu"
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Destinataires *</Label>
            <Select
              value={formData.type_destinataire}
              onValueChange={(value) => setFormData({ ...formData, type_destinataire: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout_le_monde">Tout le monde</SelectItem>
                <SelectItem value="selection_equipe">Sélection d'équipes</SelectItem>
                <SelectItem value="groupe">Par groupe (rôle/poste)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type_destinataire === "selection_equipe" && (
            <div>
              <Label htmlFor="equipes">Équipes (séparées par des virgules)</Label>
              <Input
                id="equipes"
                placeholder="ex: Equipe A, Equipe B"
                value={formData.equipes.join(", ")}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  equipes: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
              />
            </div>
          )}

          {formData.type_destinataire === "groupe" && (
            <div>
              <Label htmlFor="groupes">Groupes (séparées par des virgules)</Label>
              <Input
                id="groupes"
                placeholder="ex: admin, prothesiste, manager"
                value={formData.groupes.join(", ")}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  groupes: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
              />
            </div>
          )}

          <div>
            <Label htmlFor="date_expiration">Date d'expiration (optionnel)</Label>
            <Input
              id="date_expiration"
              type="date"
              value={formData.date_expiration}
              onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="require_confirmation"
              checked={formData.require_confirmation}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, require_confirmation: checked as boolean })
              }
            />
            <Label htmlFor="require_confirmation" className="cursor-pointer">
              Demander une confirmation de lecture
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_in_calendar"
              checked={formData.show_in_calendar}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, show_in_calendar: checked as boolean })
              }
            />
            <Label htmlFor="show_in_calendar" className="cursor-pointer">
              Afficher dans le calendrier
            </Label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
