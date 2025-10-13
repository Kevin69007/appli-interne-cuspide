import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Survey {
  id: string;
  titre: string;
  questions: any[];
  allow_anonymous: boolean;
}

interface SurveyResponseFormProps {
  survey: Survey;
  employeeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResponseSubmitted: () => void;
}

export const SurveyResponseForm = ({
  survey,
  employeeId,
  open,
  onOpenChange,
  onResponseSubmitted,
}: SurveyResponseFormProps) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier que toutes les questions ont une réponse
    const allAnswered = survey.questions.every((q) => responses[q.id]);
    if (!allAnswered) {
      toast({
        title: "Erreur",
        description: "Veuillez répondre à toutes les questions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("survey_responses").insert({
        survey_id: survey.id,
        employee_id: isAnonymous ? null : employeeId,
        reponses: responses,
        is_anonymous: isAnonymous,
      });

      if (error) throw error;

      toast({
        title: "Réponse enregistrée",
        description: "Merci d'avoir répondu à cette enquête",
      });

      onResponseSubmitted();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre réponse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case "text":
        return (
          <Textarea
            value={responses[question.id] || ""}
            onChange={(e) =>
              setResponses({ ...responses, [question.id]: e.target.value })
            }
            placeholder="Votre réponse..."
            rows={4}
          />
        );

      case "choice":
        return (
          <RadioGroup
            value={responses[question.id] || ""}
            onValueChange={(value) =>
              setResponses({ ...responses, [question.id]: value })
            }
          >
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "rating":
        return (
          <RadioGroup
            value={responses[question.id]?.toString() || ""}
            onValueChange={(value) =>
              setResponses({ ...responses, [question.id]: parseInt(value) })
            }
          >
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={rating.toString()}
                    id={`${question.id}-${rating}`}
                  />
                  <Label
                    htmlFor={`${question.id}-${rating}`}
                    className="cursor-pointer"
                  >
                    {rating}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{survey.titre}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label className="text-base">
                {index + 1}. {question.question}
              </Label>
              {renderQuestion(question)}
            </div>
          ))}

          {survey.allow_anonymous && (
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              />
              <Label htmlFor="anonymous" className="cursor-pointer">
                Répondre de manière anonyme
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer mes réponses"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
