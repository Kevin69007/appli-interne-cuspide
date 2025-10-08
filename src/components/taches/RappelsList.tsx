import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Bell, Trash2 } from "lucide-react";

interface RappelsListProps {
  taskId: string;
  rappels: any[];
  onUpdate: () => void;
}

export const RappelsList = ({ taskId, rappels, onUpdate }: RappelsListProps) => {
  const [loading, setLoading] = useState(false);
  const [newRappelDate, setNewRappelDate] = useState("");

  const handleAddRappel = async () => {
    if (!newRappelDate) return;

    setLoading(true);
    try {
      const updatedRappels = [
        ...(rappels || []),
        {
          date: newRappelDate,
          envoye: false,
        },
      ];

      const { error } = await supabase
        .from("tasks")
        .update({ rappels: updatedRappels })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Rappel ajouté");
      setNewRappelDate("");
      onUpdate();
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast.error("Erreur lors de l'ajout du rappel");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRappel = async (index: number) => {
    setLoading(true);
    try {
      const updatedRappels = rappels.filter((_, i) => i !== index);

      const { error } = await supabase
        .from("tasks")
        .update({ rappels: updatedRappels })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Rappel supprimé");
      onUpdate();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Erreur lors de la suppression du rappel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        {rappels && rappels.length > 0 ? (
          rappels.map((rappel: any, index: number) => (
            <div key={index} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bell className={`h-4 w-4 ${rappel.envoye ? "text-muted-foreground" : "text-primary"}`} />
                <span className={rappel.envoye ? "line-through text-muted-foreground" : ""}>
                  {new Date(rappel.date).toLocaleString("fr-FR")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRappel(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun rappel</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-rappel">Nouveau rappel</Label>
        <div className="flex gap-2">
          <Input
            id="new-rappel"
            type="datetime-local"
            value={newRappelDate}
            onChange={(e) => setNewRappelDate(e.target.value)}
          />
          <Button onClick={handleAddRappel} disabled={loading || !newRappelDate} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
