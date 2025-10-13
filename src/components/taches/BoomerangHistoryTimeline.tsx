import { ArrowRight, RotateCcw } from "lucide-react";

interface BoomerangHistoryEntry {
  from: string;
  to: string;
  from_name?: string;
  to_name?: string;
  sent_at: string;
  returned_at: string | null;
  auto_return?: boolean;
}

interface BoomerangHistoryTimelineProps {
  history: BoomerangHistoryEntry[];
}

export const BoomerangHistoryTimeline = ({ history }: BoomerangHistoryTimelineProps) => {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun historique de boomerang</p>;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (sentAt: string, returnedAt: string | null) => {
    if (!returnedAt) return null;
    const diff = new Date(returnedAt).getTime() - new Date(sentAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days}j ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm">Historique du Boomerang</h4>
      <div className="space-y-3">
        {history.map((entry, index) => (
          <div key={index} className="border-l-2 border-primary/30 pl-4 pb-3">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{entry.from_name || "Employé"}</span>
                  {" → "}
                  <span className="font-medium">{entry.to_name || "Employé"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Envoyé le {formatDate(entry.sent_at)}
                </p>
                
                {entry.returned_at && (
                  <div className="flex items-center gap-2 mt-2">
                    <RotateCcw className="h-3 w-3 text-green-600" />
                    <p className="text-xs text-green-600">
                      Retourné le {formatDate(entry.returned_at)}
                      {entry.auto_return && " (automatique)"}
                      {" "}
                      ({calculateDuration(entry.sent_at, entry.returned_at)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
