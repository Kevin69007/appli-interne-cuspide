import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart3, Eye } from "lucide-react";

interface Survey {
  id: string;
  titre: string;
  description: string;
  date_debut: string | null;
  date_fin: string | null;
  is_active: boolean;
  created_at: string;
  allow_anonymous: boolean;
}

export const SurveysList = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
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
    fetchSurveys();

    const channel = supabase
      .channel("surveys-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "surveys",
        },
        () => {
          fetchSurveys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-8">Chargement des enquêtes...</div>;
  }

  if (surveys.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Aucune enquête créée pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {surveys.map((survey) => (
        <Card key={survey.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{survey.titre}</CardTitle>
                {survey.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {survey.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>
                    Créée le {format(new Date(survey.created_at), "d MMMM yyyy", { locale: fr })}
                  </span>
                  {survey.date_debut && survey.date_fin && (
                    <>
                      <span>•</span>
                      <span>
                        Du {format(new Date(survey.date_debut), "d MMM", { locale: fr })} 
                        {" au "}
                        {format(new Date(survey.date_fin), "d MMM yyyy", { locale: fr })}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={survey.is_active ? "default" : "secondary"}>
                  {survey.is_active ? "Active" : "Inactive"}
                </Badge>
                {survey.allow_anonymous && (
                  <Badge variant="outline">Anonyme autorisé</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Voir les questions
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Résultats
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
