import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectifsIndividuels } from "./ObjectifsIndividuels";
import { KPIDashboard } from "./KPIDashboard";

export const DashboardObjectifs = () => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="indicateurs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="indicateurs">Indicateurs Individuels</TabsTrigger>
          <TabsTrigger value="kpi">Chiffres & KPI</TabsTrigger>
        </TabsList>

        <TabsContent value="indicateurs" className="mt-6">
          <ObjectifsIndividuels />
        </TabsContent>

        <TabsContent value="kpi" className="mt-6">
          <KPIDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
