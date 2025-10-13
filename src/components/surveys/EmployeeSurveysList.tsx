import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Circle } from "lucide-react";
import { SurveyResponseForm } from "./SurveyResponseForm";

interface Survey {
  id: string;
  titre: string;
  description: string;
  questions: any[];
  date_debut: string | null;
  date_fin: string | null;
  allow_anonymous: boolean;
  created_at: string;
}

interface EmployeeSurveysListProps {
  employeeId: string | null;
}

export const EmployeeSurveysList = ({ employeeId }: EmployeeSurveysListProps) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [respondedSurveys, setRespondedSurveys] = useState<Set<string>>(new Set());
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSurveys = async () => {
    try {
      const { data: surveys, error: surveysError } = await supabase
        .from("surveys")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (surveysError) throw surveysError;

      const { data: responses, error: responsesError } = await supabase
        .from("survey_responses")
        .select("survey_id")
        .eq("employee_id", employeeId);

      if (responsesError) throw responsesError;

      setRespondedSurveys(new Set(responses.map(r => r.survey_id)));
      setSurveys((surveys || []).map(s => ({
        ...s,
        questions: Array.isArray(s.questions) ? s.questions : []
      })));
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les enquêtes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchSurveys();
    }
  }, [employeeId]);

  const handleResponseSubmitted = () => {
    fetchSurveys();
    setSelectedSurvey(null);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des enquêtes...</div>;
  }

  if (surveys.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Aucune enquête disponible pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {surveys.map((survey) => {
          const hasResponded = respondedSurveys.has(survey.id);
          
          return (
            <Card key={survey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{survey.titre}</CardTitle>
                      {hasResponded ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {survey.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      {survey.date_fin && (
                        <span>
                          Jusqu'au {format(new Date(survey.date_fin), "d MMMM yyyy", { locale: fr })}
                        </span>
                      )}
                      {survey.allow_anonymous && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            Réponse anonyme possible
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={hasResponded ? "default" : "secondary"}>
                    {hasResponded ? "Répondu" : "Nouvelle"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setSelectedSurvey(survey)}
                  disabled={hasResponded}
                  variant={hasResponded ? "outline" : "default"}
                >
                  {hasResponded ? "Déjà répondu" : "Répondre à l'enquête"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedSurvey && (
        <SurveyResponseForm
          survey={selectedSurvey}
          employeeId={employeeId}
          open={!!selectedSurvey}
          onOpenChange={(open) => !open && setSelectedSurvey(null)}
          onResponseSubmitted={handleResponseSubmitted}
        />
      )}
    </>
  );
};
