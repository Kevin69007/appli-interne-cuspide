import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DetenteTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch current game session
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["admin-game-session"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_game_sessions")
        .select("*")
        .in("status", ["registration_open", "waiting_anecdote", "in_progress", "finished", "cancelled_no_anecdote"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch participants
  const { data: participants, refetch: refetchParticipants } = useQuery({
    queryKey: ["admin-participants", session?.id],
    queryFn: async () => {
      if (!session) return [];
      const { data, error } = await supabase
        .from("game_participants")
        .select(`
          *,
          employees:employee_id (nom, prenom)
        `)
        .eq("session_id", session.id);
      if (error) throw error;
      return data;
    },
    enabled: !!session,
    refetchInterval: 5000,
  });

  // Fetch clues
  const { data: clues, refetch: refetchClues } = useQuery({
    queryKey: ["admin-clues", session?.id],
    queryFn: async () => {
      if (!session) return [];
      const { data, error } = await supabase
        .from("game_clues")
        .select("*")
        .eq("session_id", session.id)
        .order("clue_number");
      if (error) throw error;
      return data;
    },
    enabled: !!session,
    refetchInterval: 5000,
  });

  // Fetch votes
  const { data: votes, refetch: refetchVotes } = useQuery({
    queryKey: ["admin-votes", session?.id],
    queryFn: async () => {
      if (!session) return [];
      const { data, error } = await supabase
        .from("game_votes")
        .select(`
          *,
          voter:voter_employee_id (nom, prenom),
          suspect:suspect_employee_id (nom, prenom)
        `)
        .eq("session_id", session.id)
        .order("voted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session,
    refetchInterval: 5000,
  });

  // Fetch all employees
  const { data: allEmployees } = useQuery({
    queryKey: ["all-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const addInvestigator = async (employeeId: string) => {
    if (!session) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("game_participants")
        .insert({
          session_id: session.id,
          employee_id: employeeId,
          role: "investigator",
        });

      if (error) throw error;

      toast({
        title: "✅ Enquêteur ajouté !",
        description: "L'employé a été ajouté comme enquêteur.",
      });

      refetchParticipants();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'enquêteur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      // Refresh all data after action
      refetchSession();
      refetchParticipants();
      refetchClues();
      refetchVotes();

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      registration_open: "default",
      waiting_anecdote: "secondary",
      in_progress: "default",
      finished: "outline",
      cancelled_no_anecdote: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
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
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Test & Simulation - Détente</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>🧪 Interface de test admin</CardTitle>
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

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-4">
            <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">
              🔍 Tableau de bord - État actuel
            </h4>

            {/* Session Info */}
            {session ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Statut:</span>
                  {getStatusBadge(session.status)}
                </div>
                <div className="text-sm">
                  <strong>Semaine:</strong> {session.week_number}/{session.year}
                </div>
                {session.anecdote && (
                  <div className="text-sm">
                    <strong>Anecdote:</strong> {session.anecdote.substring(0, 100)}...
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-green-800 dark:text-green-200">
                Aucune session active
              </p>
            )}

            {/* Participants Table */}
            {participants && participants.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm mb-2">
                  Participants ({participants.length})
                </h5>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {p.employees?.prenom} {p.employees?.nom}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.role === "target" ? "default" : "secondary"}>
                            {p.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.is_eliminated ? "❌ Éliminé" : "✅ Actif"}
                        </TableCell>
                        <TableCell>{p.total_points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Clues Table */}
            {clues && clues.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm mb-2">
                  Indices ({clues.filter((c: any) => c.is_revealed).length}/{clues.length} révélés)
                </h5>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Indice</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clues.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.clue_number}</TableCell>
                        <TableCell>
                          {c.is_revealed ? c.clue_text : "🔒 Masqué"}
                        </TableCell>
                        <TableCell>
                          {c.is_revealed ? "✅ Révélé" : "⏳ En attente"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Votes Summary */}
            {votes && votes.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm mb-2">
                  Votes récents ({votes.length} total)
                </h5>
                <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                  {votes.slice(0, 10).map((v: any) => (
                    <div key={v.id} className="flex justify-between">
                      <span>
                        {v.voter?.prenom} a voté {v.vote_type === "elimination" ? "contre" : "pour"}{" "}
                        {v.suspect?.prenom || "la cible"}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(v.voted_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Investigators Section */}
            {session && session.status === "in_progress" && allEmployees && participants && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <h5 className="font-semibold text-sm mb-3 text-purple-900 dark:text-purple-100">
                  👥 Ajouter des enquêteurs
                </h5>
                <div className="space-y-2">
                  {allEmployees
                    .filter(emp => !participants.some(p => p.employee_id === emp.id))
                    .map(employee => (
                      <div key={employee.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <span className="text-sm">{employee.prenom} {employee.nom}</span>
                        <Button
                          size="sm"
                          onClick={() => addInvestigator(employee.id)}
                          disabled={loading}
                        >
                          Ajouter
                        </Button>
                      </div>
                    ))}
                  {allEmployees.length > 0 && allEmployees.every(emp => participants.some(p => p.employee_id === emp.id)) && (
                    <p className="text-xs text-muted-foreground">Tous les employés participent déjà au jeu.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetenteTest;
