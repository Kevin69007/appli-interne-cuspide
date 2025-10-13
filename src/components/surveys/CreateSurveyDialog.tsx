import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Question {
  id: string;
  question: string;
  type: "text" | "choice" | "rating";
  options?: string[];
  scale?: number;
}

export const CreateSurveyDialog = ({ onSurveyCreated }: { onSurveyCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: crypto.randomUUID(), question: "", type: "text" },
    ]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim() || questions.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre et ajouter au moins une question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const { error } = await supabase.from("surveys").insert({
        titre: titre.trim(),
        description: description.trim(),
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options || [],
          scale: q.scale || 5
        })),
        date_debut: dateDebut || null,
        date_fin: dateFin || null,
        allow_anonymous: allowAnonymous,
        created_by: profile?.id,
        type_destinataire: "tout_le_monde",
      });

      if (error) throw error;

      toast({
        title: "Enquête créée",
        description: "L'enquête a été créée avec succès",
      });

      setTitre("");
      setDescription("");
      setQuestions([]);
      setDateDebut("");
      setDateFin("");
      setAllowAnonymous(false);
      setOpen(false);
      onSurveyCreated();
    } catch (error) {
      console.error("Error creating survey:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'enquête",
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
          Créer une enquête
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle enquête</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Satisfaction employés Q1 2025"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brève description de l'enquête..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateFin">Date de fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowAnonymous"
              checked={allowAnonymous}
              onCheckedChange={(checked) => setAllowAnonymous(checked as boolean)}
            />
            <Label htmlFor="allowAnonymous" className="cursor-pointer">
              Permettre les réponses anonymes
            </Label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" onClick={addQuestion} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une question
              </Button>
            </div>

            {questions.map((q, index) => (
              <div key={q.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Question {index + 1}</Label>
                  <Button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Input
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                  placeholder="Votre question..."
                  required
                />
                
                <Select
                  value={q.type}
                  onValueChange={(value) => updateQuestion(q.id, "type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texte libre</SelectItem>
                    <SelectItem value="choice">Choix multiple</SelectItem>
                    <SelectItem value="rating">Note (1-5)</SelectItem>
                  </SelectContent>
                </Select>

                {q.type === "choice" && (
                  <Textarea
                    placeholder="Options (une par ligne)"
                    value={(q.options || []).join("\n")}
                    onChange={(e) =>
                      updateQuestion(
                        q.id,
                        "options",
                        e.target.value.split("\n").filter((o) => o.trim())
                      )
                    }
                    rows={3}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer l'enquête"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
