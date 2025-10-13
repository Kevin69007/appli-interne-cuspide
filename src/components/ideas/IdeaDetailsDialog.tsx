import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Idea {
  id: string;
  titre: string;
  description: string;
  statut: string;
  is_anonymous: boolean;
  commentaire_manager: string | null;
  created_at: string;
  employees?: {
    nom: string;
    prenom: string;
  };
}

interface IdeaDetailsDialogProps {
  idea: Idea;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statutOptions: Array<{value: "soumise" | "en_examen" | "approuvee" | "rejetee" | "implementee"; label: string}> = [
  { value: "soumise", label: "Soumise" },
  { value: "en_examen", label: "En examen" },
  { value: "approuvee", label: "Approuvée" },
  { value: "rejetee", label: "Rejetée" },
  { value: "implementee", label: "Implémentée" },
];

export const IdeaDetailsDialog = ({ idea, open, onOpenChange, onUpdate }: IdeaDetailsDialogProps) => {
  const [commentaire, setCommentaire] = useState(idea.commentaire_manager || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: "soumise" | "en_examen" | "approuvee" | "rejetee" | "implementee") => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("ideas")
        .update({
          statut: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", idea.id);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: "Le statut de l'idée a été modifié",
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComment = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("ideas")
        .update({
          commentaire_manager: commentaire.trim() || null,
        })
        .eq("id", idea.id);

      if (error) throw error;

      toast({
        title: "Commentaire enregistré",
        description: "Votre commentaire a été ajouté",
      });
      onUpdate();
    } catch (error) {
      console.error("Error saving comment:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le commentaire",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{idea.titre}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Soumis le {format(new Date(idea.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
              {" par "}
              {idea.is_anonymous
                ? "un employé (anonyme)"
                : idea.employees
                ? `${idea.employees.prenom} ${idea.employees.nom}`
                : "Inconnu"}
            </p>
            <Badge>{idea.statut}</Badge>
          </div>

          <div>
            <Label>Description</Label>
            <p className="mt-1 text-sm whitespace-pre-wrap">{idea.description}</p>
          </div>

          <div>
            <Label htmlFor="commentaire">Commentaire du manager</Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajoutez un commentaire sur cette idée..."
              rows={4}
              className="mt-1"
            />
            <Button 
              onClick={handleSaveComment} 
              disabled={loading}
              className="mt-2"
              variant="outline"
            >
              Enregistrer le commentaire
            </Button>
          </div>

          <div>
            <Label>Changer le statut</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {statutOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={loading || idea.statut === option.value}
                  variant={idea.statut === option.value ? "default" : "outline"}
                  size="sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
