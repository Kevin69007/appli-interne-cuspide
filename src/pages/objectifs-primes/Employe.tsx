import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, AlertCircle, ChevronLeft, Star } from "lucide-react";
import { MonthCalendar } from "@/components/objectifs-primes/MonthCalendar";
import { AgendaWidget } from "@/components/employe/AgendaWidget";
import { TachesWidget } from "@/components/employe/TachesWidget";
import { InfosImportantesWidget } from "@/components/employe/InfosImportantesWidget";

const Employe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Mon Tableau de Bord</h1>
                <p className="text-sm text-muted-foreground">Objectifs & Primes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Widgets rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AgendaWidget />
          <TachesWidget />
          <InfosImportantesWidget />
        </div>

        {/* Score global */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-4">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Score du mois</h2>
            <div className="text-6xl font-bold text-primary mb-4">82/100</div>
            <p className="text-muted-foreground">Prime estimée: 450€</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">25</div>
              <div className="text-xs text-muted-foreground">Protocoles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">28</div>
              <div className="text-xs text-muted-foreground">Objectifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">18</div>
              <div className="text-xs text-muted-foreground">Horaires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">9</div>
              <div className="text-xs text-muted-foreground">Matériel</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">8</div>
              <div className="text-xs text-muted-foreground">Attitude</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Objectifs du mois */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Objectifs du mois</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Production</span>
                  <span className="text-sm text-muted-foreground">8/10</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Qualité</span>
                  <span className="text-sm text-muted-foreground">15/15</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Formation</span>
                  <span className="text-sm text-muted-foreground">3/5</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </div>

            <Button className="w-full mt-6" variant="outline">
              Déclarer un objectif
            </Button>
          </Card>

          {/* Quiz du mois */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Quiz du mois</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Quiz technique - Janvier 2025</p>
                <p className="text-sm text-muted-foreground mb-3">
                  10 questions sur les protocoles de stérilisation
                </p>
                <Button className="w-full">Répondre au quiz</Button>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Vote collègue du mois</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Qui mérite d'être collègue du mois ?
                </p>
                <Button className="w-full" variant="outline">Voter</Button>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Mood Bar</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Comment vous sentez-vous ce mois-ci ?
                </p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-2 hover:scale-110 transition-transform"
                    >
                      <Star className="h-6 w-6 text-muted-foreground hover:text-yellow-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Agenda du mois */}
        <div className="mb-8">
          <MonthCalendar />
        </div>

        {/* Historique récent */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Activité récente</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-green-500/10 rounded">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Objectif validé</p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
              <span className="text-sm font-medium text-green-600">+5 pts</span>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-orange-500/10 rounded">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">En attente de validation</p>
                <p className="text-xs text-muted-foreground">Hier à 16h30</p>
              </div>
              <span className="text-sm text-muted-foreground">En cours</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Employe;
