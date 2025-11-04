import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPIDashboardView } from "./kpi/dashboard/KPIDashboardView";
import { KPIAnalysisView } from "./kpi/analysis/KPIAnalysisView";
import { KPIDataView } from "./kpi/data/KPIDataView";
import { KPIList } from "./KPIList";
import { KPIObjectifsConfig } from "./kpi/config/KPIObjectifsConfig";

export const KPIDashboard = () => {
  const { isAdmin, isManager } = useUserRole();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">📈 Dashboard</TabsTrigger>
          <TabsTrigger value="analysis">🔍 Analyse</TabsTrigger>
          <TabsTrigger value="data">📋 Données</TabsTrigger>
          {isAdmin && <TabsTrigger value="config">⚙️ Configuration</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <KPIDashboardView />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <KPIAnalysisView />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <KPIDataView />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="config" className="mt-6">
            <div className="space-y-6">
              <KPIList onSuccess={() => {}} />
              <KPIObjectifsConfig />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
