import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthCalendar } from "@/components/objectifs-primes/MonthCalendar";
import { PlanningCalendar } from "@/components/planning/PlanningCalendar";
import { TimeDeclarationForm } from "@/components/planning/TimeDeclarationForm";
import { TimeDeclarationHistory } from "@/components/planning/TimeDeclarationHistory";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";

const Agenda = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('planning');
  const { isAdmin, isManager } = useUserRole();
  const [refreshHistory, setRefreshHistory] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Mon Agenda</h1>
              <p className="text-sm text-muted-foreground">Planning et événements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="agenda" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agenda">{t('tabs.personal')}</TabsTrigger>
            <TabsTrigger value="planning">{t('tabs.team')}</TabsTrigger>
            <TabsTrigger value="declaration">{t('tabs.timeDeclaration')}</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="space-y-4">
            <MonthCalendar />
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <PlanningCalendar />
          </TabsContent>

          <TabsContent value="declaration" className="space-y-6">
            <TimeDeclarationForm onSuccess={() => setRefreshHistory(prev => prev + 1)} />
            <TimeDeclarationHistory key={refreshHistory} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Agenda;
