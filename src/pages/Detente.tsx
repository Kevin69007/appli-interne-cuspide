import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameSession } from "@/hooks/useGameSession";
import { useGameRole } from "@/hooks/useGameRole";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Loader2, Frown, ChevronLeft, FlaskConical } from "lucide-react";

const Detente = () => {
  const navigate = useNavigate();
  const { session, participation, isLoading, register, isRegistering, submitAnecdote, isSubmitting } = useGameSession();
  const { data: role } = useGameRole(session?.id);
  const { isAdmin } = useUserRole();

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
    const [anecdote, setAnecdote] = useState("");
    const [clues, setClues] = useState(["", "", "", "", ""]);

    const handleSubmit = () => {
      if (!anecdote.trim()) {
        alert("Veuillez saisir une anecdote");
        return;
      }
      if (clues.some(c => !c.trim())) {
        alert("Veuillez saisir les 5 indices");
        return;
      }
      submitAnecdote({ anecdote, clues });
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
            <CardTitle>
              {role?.role === "target" ? "🎯 Vous êtes la Cible" : "🕵️ Vous êtes Enquêteur"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <h3 className="font-semibold mb-2">📖 L'anecdote</h3>
                <p className="italic">{session.anecdote}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Interface complète en cours de développement...
              </p>
            </div>
          </CardContent>
        </Card>
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
