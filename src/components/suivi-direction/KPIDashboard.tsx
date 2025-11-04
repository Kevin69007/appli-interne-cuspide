import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { CreateKPIDialog } from "./CreateKPIDialog";
import { KPIList } from "./KPIList";
import { KPIValuesTable } from "./KPIValuesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const KPIDashboard = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin, isManager } = useUserRole();

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chiffres & KPI</h3>
        {isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Créer un KPI
          </Button>
        )}
      </div>

      <Tabs defaultValue="values" className="w-full">
        <TabsList>
          <TabsTrigger value="values">Valeurs saisies</TabsTrigger>
          {(isAdmin || isManager) && <TabsTrigger value="config">Configuration KPI</TabsTrigger>}
        </TabsList>

        <TabsContent value="values" className="mt-4">
          <KPIValuesTable key={refreshKey} onSuccess={handleSuccess} />
        </TabsContent>

        {(isAdmin || isManager) && (
          <TabsContent value="config" className="mt-4">
            <KPIList key={refreshKey} onSuccess={handleSuccess} />
          </TabsContent>
        )}
      </Tabs>

      {isAdmin && (
        <CreateKPIDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
