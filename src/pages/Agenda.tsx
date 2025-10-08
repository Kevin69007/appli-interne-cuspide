import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthCalendar } from "@/components/objectifs-primes/MonthCalendar";
import { PlanningCalendar } from "@/components/planning/PlanningCalendar";
import { useUserRole } from "@/hooks/useUserRole";

const Agenda = () => {
  const navigate = useNavigate();
  const { isAdmin, isManager } = useUserRole();

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
        <Tabs defaultValue="planning" className="space-y-4">
          <TabsList>
            <TabsTrigger value="planning">Planning d'équipe</TabsTrigger>
            <TabsTrigger value="agenda">Agenda personnel</TabsTrigger>
          </TabsList>

          <TabsContent value="planning" className="space-y-4">
            <PlanningCalendar />
          </TabsContent>

          <TabsContent value="agenda" className="space-y-4">
            <MonthCalendar />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Agenda;
