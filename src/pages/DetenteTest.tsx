import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const DetenteTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const callEdgeFunction = async (functionName: string, body?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: body || {},
      });

      if (error) throw error;

      toast({
        title: `✅ ${functionName} réussi`,
        description: JSON.stringify(data, null, 2),
      });

      return data;
    } catch (error: any) {
      toast({
        title: `❌ Erreur ${functionName}`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "1. Ouvrir les inscriptions",
      description: "Crée une nouvelle session et ouvre les inscriptions (statut: registration_open)",
      action: () => callEdgeFunction("start-weekly-game"),
    },
    {
      title: "2. Tirer au sort la Cible",
      description: "Fait le tirage au sort parmi les participants inscrits (statut: waiting_anecdote)",
      action: () => callEdgeFunction("draw-target"),
    },
    {
      title: "3. Révéler l'anecdote",
      description: "Révèle l'anecdote soumise par la Cible (statut: in_progress) ou annule si pas d'anecdote",
      action: () => callEdgeFunction("reveal-anecdote"),
    },
    {
      title: "4. Révéler un indice quotidien",
      description: "Révèle l'indice du jour (mardi=2, mercredi=3, jeudi=4)",
      action: () => callEdgeFunction("daily-clue-reveal"),
    },
    {
      title: "5. Traiter les éliminations",
      description: "Compte les votes et élimine les 3 suspects les plus votés",
      action: () => callEdgeFunction("process-daily-eliminations"),
    },
    {
      title: "6. Vote final et résultats",
      description: "Révèle le dernier indice, calcule les scores et termine le jeu (statut: finished)",
      action: () => callEdgeFunction("final-vote-reveal"),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test & Simulation - Détente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Page de test admin - Permet de simuler manuellement toutes les phases du jeu sans attendre les crons automatiques.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <Button
                      onClick={step.action}
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          En cours...
                        </>
                      ) : (
                        "Exécuter"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              📋 Instructions pour un test complet :
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Ouvrir les inscriptions (étape 1)</li>
              <li>Aller sur /detente et s'inscrire avec plusieurs comptes</li>
              <li>Tirer au sort la Cible (étape 2)</li>
              <li>La Cible doit soumettre une anecdote et 5 indices</li>
              <li>Révéler l'anecdote (étape 3)</li>
              <li>Les enquêteurs votent pour éliminer des suspects</li>
              <li>Traiter les éliminations quotidiennes (étape 5)</li>
              <li>Répéter vote + élimination sur 3 jours</li>
              <li>Vote final et résultats (étape 6)</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">
              🔍 Vérifier l'état actuel :
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
              Consultez les tables suivantes dans Supabase pour voir l'état du jeu :
            </p>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
              <li>weekly_game_sessions - Voir le statut de la session active</li>
              <li>game_participants - Liste des participants et leurs rôles</li>
              <li>game_clues - Indices révélés</li>
              <li>game_votes - Votes des enquêteurs</li>
              <li>game_player_stats - Statistiques des joueurs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetenteTest;
