import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { IdeaDetailsDialog } from "./IdeaDetailsDialog";

interface Idea {
  id: string;
  titre: string;
  description: string;
  statut: string;
  is_anonymous: boolean;
  commentaire_manager: string | null;
  created_at: string;
  employee_id: string | null;
  employees?: {
    nom: string;
    prenom: string;
  };
}

interface IdeasListProps {
  isManager: boolean;
  employeeId?: string | null;
}

const statutLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  soumise: { label: "Soumise", variant: "secondary" },
  en_examen: { label: "En examen", variant: "default" },
  approuvee: { label: "Approuvée", variant: "default" },
  rejetee: { label: "Rejetée", variant: "destructive" },
  implementee: { label: "Implémentée", variant: "default" },
};

export const IdeasList = ({ isManager, employeeId }: IdeasListProps) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const { toast } = useToast();

  const fetchIdeas = async () => {
    try {
      let query = supabase
        .from("ideas")
        .select(`
          *,
          employees (
            nom,
            prenom
          )
        `)
        .order("created_at", { ascending: false });

      if (!isManager && employeeId) {
        query = query.eq("employee_id", employeeId).eq("is_anonymous", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les idées",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();

    const channel = supabase
      .channel("ideas-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideas",
        },
        () => {
          fetchIdeas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isManager, employeeId]);

  if (loading) {
    return <div className="text-center py-8">Chargement des idées...</div>;
  }

  if (ideas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            {isManager ? "Aucune idée soumise pour le moment" : "Vous n'avez pas encore soumis d'idée"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {ideas.map((idea) => (
        <Card 
          key={idea.id} 
          className={isManager ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}
          onClick={() => isManager && setSelectedIdea(idea)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{idea.titre}</CardTitle>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>
                    {idea.is_anonymous
                      ? "Anonyme"
                      : idea.employees
                      ? `${idea.employees.prenom} ${idea.employees.nom}`
                      : "Inconnu"}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(idea.created_at), "d MMMM yyyy", { locale: fr })}</span>
                </div>
              </div>
              <Badge variant={statutLabels[idea.statut]?.variant || "default"}>
                {statutLabels[idea.statut]?.label || idea.statut}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm line-clamp-3">{idea.description}</p>
            {idea.commentaire_manager && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-semibold mb-1">Commentaire du manager :</p>
                <p className="text-sm">{idea.commentaire_manager}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {selectedIdea && (
        <IdeaDetailsDialog
          idea={selectedIdea}
          open={!!selectedIdea}
          onOpenChange={(open) => !open && setSelectedIdea(null)}
          onUpdate={fetchIdeas}
        />
      )}
    </div>
  );
};
