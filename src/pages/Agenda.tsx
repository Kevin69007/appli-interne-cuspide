import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthCalendar } from "@/components/objectifs-primes/MonthCalendar";
import { PlanningCalendar } from "@/components/planning/PlanningCalendar";
import { TimeDeclarationForm } from "@/components/planning/TimeDeclarationForm";
import { TimeDeclarationHistory } from "@/components/planning/TimeDeclarationHistory";
import { ModuleHelpButton } from "@/components/communication/ModuleHelpButton";
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold truncate">{t('myAgenda')}</h1>
                <ModuleHelpButton moduleId="planning" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t('planningAndEvents')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="agenda" className="space-y-4">
          <TabsList scrollable>
            <TabsTrigger value="agenda" className="text-xs sm:text-sm">{t('tabs.personal')}</TabsTrigger>
            <TabsTrigger value="planning" className="text-xs sm:text-sm">{t('tabs.team')}</TabsTrigger>
            <TabsTrigger value="declaration" className="text-xs sm:text-sm">{t('tabs.timeDeclaration')}</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="space-y-4">
            <MonthCalendar />
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <PlanningCalendar />
          </TabsContent>

          <TabsContent value="declaration" className="space-y-4 sm:space-y-6">
            <TimeDeclarationForm onSuccess={() => setRefreshHistory(prev => prev + 1)} />
            <TimeDeclarationHistory key={refreshHistory} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Agenda;
