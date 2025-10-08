import { Card } from "@/components/ui/card";
import { Info, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Communication {
  id: string;
  titre: string;
  contenu: string;
  require_confirmation: boolean;
  show_in_calendar: boolean;
  created_at: string;
  isRead: boolean;
}

export const InfosImportantesWidget = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;
      setEmployeeId(employee.id);

      // Récupérer les communications
      const { data: comms } = await supabase
        .from("communications")
        .select("*")
        .eq("is_active", true)
        .or(`date_expiration.is.null,date_expiration.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (!comms) return;

      // Vérifier les lectures
      const { data: lectures } = await supabase
        .from("communication_lectures")
        .select("communication_id")
        .eq("employee_id", employee.id);

      const readIds = new Set(lectures?.map(l => l.communication_id) || []);

      const enrichedComms = comms.map(comm => ({
        ...comm,
        isRead: readIds.has(comm.id)
      })).filter(comm => !comm.require_confirmation || !comm.isRead);

      setCommunications(enrichedComms);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (commId: string) => {
    if (!employeeId) return;

    try {
      await supabase
        .from("communication_lectures")
        .insert({
          communication_id: commId,
          employee_id: employeeId
        });

      toast({
        title: "Marqué comme lu",
        description: "L'information a été marquée comme lue"
      });

      fetchCommunications();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme lu",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Info className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Informations Importantes</h3>
        {communications.length > 0 && (
          <Badge variant="destructive">{communications.length}</Badge>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : communications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune information à afficher</p>
        ) : (
          communications.map((comm) => (
            <div key={comm.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold">{comm.titre}</h4>
                {comm.require_confirmation && !comm.isRead && (
                  <Badge variant="outline">À confirmer</Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {comm.contenu}
              </p>

              {comm.require_confirmation && !comm.isRead && (
                <Button 
                  size="sm" 
                  onClick={() => markAsRead(comm.id)}
                  className="w-full mt-2"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marquer comme lu
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
