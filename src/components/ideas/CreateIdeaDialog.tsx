import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface CreateIdeaDialogProps {
  employeeId: string | null;
  onIdeaCreated: () => void;
}

export const CreateIdeaDialog = ({ employeeId, onIdeaCreated }: CreateIdeaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titre.trim() || !description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.from("ideas").insert({
        titre: titre.trim(),
        description: description.trim(),
        employee_id: isAnonymous ? null : employeeId,
        is_anonymous: isAnonymous,
      });

      if (error) throw error;

      toast({
        title: "Idée soumise",
        description: isAnonymous 
          ? "Votre idée a été soumise de manière anonyme"
          : "Votre idée a été soumise avec succès",
      });

      setTitre("");
      setDescription("");
      setIsAnonymous(false);
      setOpen(false);
      onIdeaCreated();
    } catch (error) {
      console.error("Error creating idea:", error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre l'idée",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Soumettre une idée
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Soumettre une nouvelle idée</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre de l'idée</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Améliorer le processus de..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre idée en détail..."
              rows={5}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <Label htmlFor="anonymous" className="text-sm cursor-pointer">
              Soumettre de manière anonyme
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Soumettre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
