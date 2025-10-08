import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface MaintenanceLog {
  id: string;
  machine_piece: string;
  maintenance_type: string;
  completed_at: string;
  completed_by: string;
  photos: string[];
  notes: string;
  task_id: string;
  task?: {
    titre: string;
  };
  employee?: {
    nom: string;
    prenom: string;
  };
}

interface MaintenanceLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MaintenanceLogDialog = ({ open, onOpenChange }: MaintenanceLogDialogProps) => {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_log")
        .select(`
          *,
          task:tasks(titre),
          employee:employees(nom, prenom)
        `)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching maintenance logs:", error);
      toast.error("Erreur lors du chargement du journal");
    } finally {
      setLoading(false);
    }
  };

  const groupByMachinePiece = (type: string) => {
    const filtered = logs.filter(log => log.maintenance_type === type);
    const grouped: Record<string, MaintenanceLog[]> = {};
    
    filtered.forEach(log => {
      if (!grouped[log.machine_piece]) {
        grouped[log.machine_piece] = [];
      }
      grouped[log.machine_piece].push(log);
    });
    
    return grouped;
  };

  const renderLogGroup = (grouped: Record<string, MaintenanceLog[]>) => {
    return Object.entries(grouped).map(([name, logs]) => (
      <Card key={name} className="mb-4">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">{name}</h3>
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="border-l-2 border-primary pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{log.task?.titre}</p>
                    <p className="text-sm text-muted-foreground">
                      Par {log.employee?.prenom} {log.employee?.nom}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(log.completed_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                {log.notes && (
                  <p className="text-sm mb-2">{log.notes}</p>
                )}
                {log.photos && log.photos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {log.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Journal d'entretien</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          <Tabs defaultValue="machines" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="machines">Machines</TabsTrigger>
              <TabsTrigger value="pieces">Pièces/Locaux</TabsTrigger>
            </TabsList>

            <TabsContent value="machines" className="mt-6">
              {Object.keys(groupByMachinePiece("machine")).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun historique</p>
              ) : (
                renderLogGroup(groupByMachinePiece("machine"))
              )}
            </TabsContent>

            <TabsContent value="pieces" className="mt-6">
              {Object.keys(groupByMachinePiece("piece")).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun historique</p>
              ) : (
                renderLogGroup(groupByMachinePiece("piece"))
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};