import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameSession } from "@/hooks/useGameSession";
import { useGameRole } from "@/hooks/useGameRole";
import { useUserRole } from "@/hooks/useUserRole";
import { useInvestigatorGame } from "@/hooks/useInvestigatorGame";
import { Button } from "@/components/ui/button";
import { Loader2, Frown, ChevronLeft, FlaskConical, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Detente = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, participation, isLoading, register, isRegistering, submitAnecdote, isSubmitting } = useGameSession();
  const { data: role } = useGameRole(session?.id);
  const { isAdmin } = useUserRole();
  const { clues: revealedClues, myVote, allEmployees, vote, isVoting, voteAnecdote, isVotingAnecdote, voteClue, isVotingClue } = useInvestigatorGame(session?.id);
  
  // State for target anecdote submission (must be at component level, not conditional)
  const [anecdote, setAnecdote] = useState("");
  const [clues, setClues] = useState(["", "", "", "", ""]);
  const [selectedVote, setSelectedVote] = useState<string>("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // No active session
  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Détente - La Cible de la semaine</h1>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/detente-test")}>
              <FlaskConical className="h-4 w-4" />
              Mode Test
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>🎮 Aucun jeu actif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Aucun jeu actif pour le moment. Le prochain tirage aura lieu lundi matin à 8h !
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game cancelled
  if (session.status === "cancelled_no_anecdote") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Détente - La Cible de la semaine</h1>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/detente-test")}>
              <FlaskConical className="h-4 w-4" />
              Mode Test
            </Button>
          )}
        </div>
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Frown className="h-6 w-6 text-orange-600" />
              Pas de jeu cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La Cible n'a pas soumis d'anecdote à temps. Le jeu de la semaine est annulé.
            </p>
            <p className="text-sm text-orange-700">
              Encouragez vos collègues à participer activement pour que tout le monde puisse profiter du jeu !
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration phase
  if (session.status === "registration_open") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Détente - La Cible de la semaine</h1>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/detente-test")}>
              <FlaskConical className="h-4 w-4" />
              Mode Test
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>🎲 Tirage au sort de la Cible !</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              Préparez-vous, le tirage au sort est ouvert jusqu'à 12h !
            </p>
            <p className="text-muted-foreground">
              Cliquez vite pour participer au tirage de la Cible de la semaine.
            </p>
            {!participation ? (
              <Button
                onClick={() => register()}
                disabled={isRegistering}
                size="lg"
                className="w-full"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  "JE PARTICIPE 🎯"
                )}
              </Button>
            ) : (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-green-700 font-medium">
                  ✅ Vous êtes inscrit ! Le tirage aura lieu à 12h.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Target waiting for anecdote
  if (session.status === "waiting_anecdote" && role?.role === "target") {
    const handleSubmit = () => {
      if (!anecdote.trim()) {
        toast({
          title: "Anecdote requise",
          description: "Veuillez saisir une anecdote",
          variant: "destructive"
        });
        return;
      }
      if (clues.some(c => !c.trim())) {
        toast({
          title: "Indices requis",
          description: "Veuillez saisir les 5 indices",
          variant: "destructive"
        });
        return;
      }
      
      submitAnecdote({ anecdote, clues }, {
        onSuccess: () => {
          toast({
            title: "✅ Anecdote envoyée !",
            description: "Votre anecdote et vos indices ont été soumis avec succès. Le jeu va bientôt commencer !",
          });
          // Reset form
          setAnecdote("");
          setClues(["", "", "", "", ""]);
        },
        onError: (error: Error) => {
          toast({
            title: "Erreur",
            description: error.message || "Une erreur est survenue lors de l'envoi",
            variant: "destructive"
          });
        }
      });
    };

    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Détente - La Cible de la semaine</h1>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/detente-test")}>
              <FlaskConical className="h-4 w-4" />
              Mode Test
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>🎯 Vous êtes la Cible !</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="mb-4">
              Cette semaine, vous êtes la Cible ! Vous devez écrire une anecdote et préparer 5 indices avant 14h.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Votre anecdote et vos indices seront notés par les enquêteurs. Des points bonus vous seront attribués si vous résistez !
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  📖 Votre anecdote
                </label>
                <textarea
                  value={anecdote}
                  onChange={(e) => setAnecdote(e.target.value)}
                  placeholder="Racontez une anecdote personnelle intéressante..."
                  className="w-full min-h-[120px] p-3 border rounded-md"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  🔍 Vos 5 indices (du plus difficile au plus facile)
                </label>
                {clues.map((clue, index) => (
                  <div key={index} className="mb-2">
                    <input
                      type="text"
                      value={clue}
                      onChange={(e) => {
                        const newClues = [...clues];
                        newClues[index] = e.target.value;
                        setClues(newClues);
                      }}
                      placeholder={`Indice ${index + 1}`}
                      className="w-full p-2 border rounded-md"
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Valider mon anecdote et mes indices"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game in progress
  if (session.status === "in_progress") {
    const handleVoteSubmit = () => {
      if (!selectedVote) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner une personne",
          variant: "destructive"
        });
        return;
      }
      
      vote(selectedVote, {
        onSuccess: () => {
          toast({
            title: "✅ Vote enregistré !",
            description: "Votre vote a été pris en compte.",
          });
          setSelectedVote("");
        },
        onError: (error: Error) => {
          toast({
            title: "Erreur",
            description: error.message || "Erreur lors du vote",
            variant: "destructive"
          });
        }
      });
    };

    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Détente - La Cible de la semaine</h1>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/detente-test")}>
              <FlaskConical className="h-4 w-4" />
              Mode Test
            </Button>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Anecdote Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {role?.role === "target" ? "🎯 Vous êtes la Cible" : "🕵️ Vous êtes Enquêteur"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-secondary rounded-lg">
                <h3 className="font-semibold mb-2">📖 L'anecdote</h3>
                <p className="italic">{session.anecdote}</p>
              </div>
            </CardContent>
          </Card>

          {/* Investigator specific content */}
          {role?.role === "investigator" && (
            <>
              {/* Revealed Clues */}
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Indices révélés</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    console.log("🔍 Rendering clues - revealedClues:", revealedClues);
                    console.log("🔍 revealedClues length:", revealedClues?.length);
                    return null;
                  })()}
                  {revealedClues && revealedClues.length > 0 ? (
                    <div className="space-y-2">
                      {revealedClues.map((clue) => (
                        <div key={clue.id} className="p-3 bg-secondary rounded-lg">
                          <Badge variant="outline" className="mb-2">Indice {clue.clue_number}</Badge>
                          <p>{clue.clue_text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun indice révélé pour le moment...</p>
                  )}
                </CardContent>
              </Card>

              {/* Vote for Anecdote */}
              <Card>
                <CardHeader>
                  <CardTitle>⭐ Notez l'anecdote</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Évaluez l'originalité de l'anecdote (1 = peu original, 5 = très original)
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        onClick={() => voteAnecdote(rating, {
                          onSuccess: () => {
                            toast({
                              title: "✅ Vote enregistré !",
                              description: `Vous avez noté l'anecdote ${rating}/5`,
                            });
                          },
                          onError: (error: Error) => {
                            toast({
                              title: "Erreur",
                              description: error.message || "Erreur lors du vote",
                              variant: "destructive",
                            });
                          }
                        })}
                        disabled={isVotingAnecdote}
                        variant="outline"
                        className="flex-1"
                      >
                        {rating} ⭐
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vote for Clues */}
              {revealedClues && revealedClues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>💡 Notez les indices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Évaluez la difficulté et l'originalité de chaque indice
                    </p>
                    {revealedClues.map((clue) => (
                      <div key={clue.id} className="p-4 border rounded-lg space-y-3">
                        <div>
                          <Badge variant="outline" className="mb-2">Indice {clue.clue_number}</Badge>
                          <p className="text-sm">{clue.clue_text}</p>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium mb-1">Difficulté (1 = facile, 5 = difficile)</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <Button
                                  key={rating}
                                  onClick={() => voteClue({ 
                                    clueId: clue.id, 
                                    difficultyRating: rating,
                                    originalityRating: 3 // valeur par défaut
                                  }, {
                                    onSuccess: () => {
                                      toast({
                                        title: "✅ Vote enregistré !",
                                        description: `Difficulté: ${rating}/5`,
                                      });
                                    },
                                    onError: (error: Error) => {
                                      toast({
                                        title: "Erreur",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                    }
                                  })}
                                  disabled={isVotingClue}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  {rating}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Voting Section */}
              <Card>
                <CardHeader>
                  <CardTitle>🗳️ Qui est la Cible ?</CardTitle>
                </CardHeader>
                <CardContent>
                  {myVote ? (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-medium">
                          Vous avez voté pour : {myVote.suspect_employee?.prenom} {myVote.suspect_employee?.nom}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Sélectionnez qui vous pensez être la Cible de cette semaine :
                      </p>
                      <div className="space-y-2">
                        {allEmployees?.map((employee) => (
                          <div
                            key={employee.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedVote === employee.id
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-secondary"
                            }`}
                            onClick={() => setSelectedVote(employee.id)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {employee.photo_url ? (
                                  <img 
                                    src={employee.photo_url} 
                                    alt={`${employee.prenom} ${employee.nom}`}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                      {employee.prenom[0]}{employee.nom[0]}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">
                                    {employee.prenom} {employee.nom}
                                  </p>
                                  {employee.poste && (
                                    <p className="text-xs text-muted-foreground">{employee.poste}</p>
                                  )}
                                </div>
                              </div>
                              {selectedVote === employee.id && (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleVoteSubmit}
                        disabled={isVoting || !selectedVote}
                        size="lg"
                        className="w-full"
                      >
                        {isVoting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi du vote...
                          </>
                        ) : (
                          "Confirmer mon vote"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Target specific message */}
          {role?.role === "target" && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Les enquêteurs essaient de vous identifier ! Restez discret... 🤫
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Game finished
  if (session.status === "finished") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Détente - La Cible de la semaine</h1>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/detente-test")}>
              <FlaskConical className="h-4 w-4" />
              Mode Test
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>🎉 Jeu terminé !</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Résultats de la semaine à venir...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default Detente;
