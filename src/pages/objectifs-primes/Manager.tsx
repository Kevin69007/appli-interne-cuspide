import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Target, Award, ChevronLeft } from "lucide-react";

const Manager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, isAdmin, isManager } = useUserRole();
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (!user || (!isAdmin && !isManager)) {
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
                <h1 className="text-2xl font-bold">Objectifs & Primes</h1>
                <p className="text-sm text-muted-foreground">Vue Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Clôturer le mois</Button>
              <Button>+ Ajouter une entrée</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employés actifs</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objectifs atteints</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-2xl font-bold">82/100</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Agenda mensuel</h2>
            <p className="text-sm text-muted-foreground">
              Cliquez sur un jour pour ajouter une entrée
            </p>
          </div>
          
          <div className="h-[600px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Calendrier interactif</p>
              <p className="text-sm">Fonctionnalité en développement</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Manager;
