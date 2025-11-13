import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, FileText, Shield, ChevronLeft, Calendar, Target, Award, Trophy, Gift } from "lucide-react";
import { AddEmployeeDialog } from "@/components/objectifs-primes/AddEmployeeDialog";
import { EmployeeObjectivesDialog } from "@/components/objectifs-primes/EmployeeObjectivesDialog";
import { EmployeesList } from "@/components/objectifs-primes/EmployeesList";
import { BonusMalusConfig } from "@/components/objectifs-primes/BonusMalusConfig";
import { GeneralConfig } from "@/components/objectifs-primes/GeneralConfig";
import { BestOfMonthAdmin } from "@/components/objectifs-primes/BestOfMonthAdmin";
import { RewardCatalogAdmin } from "@/components/objectifs-primes/RewardCatalogAdmin";
import { MonthlyClosurePanel } from "@/components/objectifs-primes/MonthlyClosurePanel";
import { TeamManagersConfig } from "@/components/objectifs-primes/TeamManagersConfig";
import { ColleagueVoteResults } from "@/components/objectifs-primes/ColleagueVoteResults";
import { MoodRatingsAdmin } from "@/components/objectifs-primes/MoodRatingsAdmin";

const Admin = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();

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
                <h1 className="text-2xl font-bold">Administration</h1>
                <p className="text-sm text-muted-foreground">
                  Indicateurs & Primes - {isAdmin ? "Administrateur" : "Manager"}
                </p>
              </div>
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
                <p className="text-sm text-muted-foreground">Indicateurs atteints</p>
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

        <Tabs defaultValue="baremes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="baremes">
              <Settings className="h-4 w-4 mr-2" />
              Barèmes
            </TabsTrigger>
            <TabsTrigger value="general">
              <FileText className="h-4 w-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="h-4 w-4 mr-2" />
              Employés
            </TabsTrigger>
            <TabsTrigger value="votes">
              <Users className="h-4 w-4 mr-2" />
              Votes
            </TabsTrigger>
            <TabsTrigger value="mood">
              <Trophy className="h-4 w-4 mr-2" />
              Mood
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift className="h-4 w-4 mr-2" />
              Récompenses
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Shield className="h-4 w-4 mr-2" />
              Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="baremes">
            <Card className="p-6">
              <BonusMalusConfig />
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <GeneralConfig />
          </TabsContent>

          <TabsContent value="employees">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Gestion des employés</h3>
                <div className="flex gap-2">
                  <EmployeeObjectivesDialog />
                  <AddEmployeeDialog onEmployeeAdded={() => setRefreshKey(prev => prev + 1)} />
                </div>
              </div>
              <EmployeesList key={refreshKey} />
            </Card>
          </TabsContent>

          <TabsContent value="votes">
            <ColleagueVoteResults />
          </TabsContent>

          <TabsContent value="mood">
            <MoodRatingsAdmin />
          </TabsContent>

          <TabsContent value="rewards">
            <Card className="p-6">
              <RewardCatalogAdmin />
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Journal d'audit</h3>
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Logs d'audit à venir</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
