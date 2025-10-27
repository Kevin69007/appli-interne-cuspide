import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

interface Decision {
  type: string;
  description: string;
  action_required: boolean;
}

interface MeetingDecisionsProps {
  meetingId: string;
}

export const MeetingDecisions = ({ meetingId }: MeetingDecisionsProps) => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecisions();
  }, [meetingId]);

  const fetchDecisions = async () => {
    try {
      const { data, error } = await supabase
        .from("project_meetings")
        .select("decisions")
        .eq("id", meetingId)
        .single();

      if (error) throw error;
      
      if (data?.decisions) {
        const decisionsData = Array.isArray(data.decisions) ? data.decisions : [];
        setDecisions(decisionsData.map((d: any) => ({
          type: d.type || '',
          description: d.description || '',
          action_required: d.action_required || false,
        })));
      }
    } catch (error) {
      console.error("Error fetching decisions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="animate-pulse">Chargement des décisions...</div>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold mb-4">Décisions et actions</h3>
        <p className="text-muted-foreground">Aucune décision extraite pour cette réunion.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="font-semibold mb-4">Décisions et actions</h3>
      <div className="space-y-3">
        {decisions.map((decision, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border"
          >
            {decision.action_required ? (
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {decision.type}
                </Badge>
                {decision.action_required && (
                  <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs">
                    Action requise
                  </Badge>
                )}
              </div>
              <p className="text-sm">{decision.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
