import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import EntretiensMachines from "./EntretiensMachines";
import Logs from "./Logs";
import { PointageList } from "@/components/suivi-direction/PointageList";
import { DashboardObjectifs } from "@/components/suivi-direction/DashboardObjectifs";
import { ManagerTeamDashboard } from "@/components/suivi-direction/ManagerTeamDashboard";
import { ModuleVisibilityConfig } from "@/components/admin/ModuleVisibilityConfig";
import { ModuleHelpButton } from "@/components/communication/ModuleHelpButton";
import { useTranslation } from "react-i18next";

const SuiviDirection = () => {
  const navigate = useNavigate();
  const { isAdmin, isManager, loading } = useUserRole();
  const { t } = useTranslation(['direction', 'common']);

  useEffect(() => {
    if (!loading && !isAdmin && !isManager) {
      toast.error(t('accessDenied'));
      navigate("/");
    }
  }, [isAdmin, isManager, loading, navigate, t]);

  if (loading || (!isAdmin && !isManager)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <ModuleHelpButton moduleId="direction" />
        </div>

        <Tabs defaultValue={isManager && !isAdmin ? "mes-equipes" : "dashboard"} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-6" : isManager && !isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
            {isManager && !isAdmin && (
              <TabsTrigger value="mes-equipes">{t('tabs.myTeams')}</TabsTrigger>
            )}
            <TabsTrigger value="dashboard">{t('tabs.dashboard')}</TabsTrigger>
            <TabsTrigger value="pointage">{t('tabs.timeTracking')}</TabsTrigger>
            <TabsTrigger value="entretiens">{t('tabs.maintenance')}</TabsTrigger>
            <TabsTrigger value="audit">{t('tabs.audit')}</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="modules">{t('tabs.modules')}</TabsTrigger>
            )}
          </TabsList>

          {isManager && !isAdmin && (
            <TabsContent value="mes-equipes" className="mt-6">
              <ManagerTeamDashboard />
            </TabsContent>
          )}

          <TabsContent value="dashboard" className="mt-6">
            <DashboardObjectifs />
          </TabsContent>

          <TabsContent value="pointage" className="mt-6">
            <PointageList />
          </TabsContent>

          <TabsContent value="entretiens" className="mt-6">
            <EntretiensMachines />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Logs />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="modules" className="mt-6">
              <ModuleVisibilityConfig />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default SuiviDirection;