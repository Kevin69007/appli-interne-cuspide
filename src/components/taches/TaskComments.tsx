import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface TaskCommentsProps {
  taskId: string;
  comments: any[];
  currentEmployeeId: string | null;
  onUpdate: () => void;
}

export const TaskComments = ({ taskId, comments, currentEmployeeId, onUpdate }: TaskCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    fetchEmployeeName();
  }, [currentEmployeeId]);

  const fetchEmployeeName = async () => {
    if (!currentEmployeeId) return;

    const { data } = await supabase
      .from("employees")
      .select("nom, prenom")
      .eq("id", currentEmployeeId)
      .single();

    if (data) {
      setEmployeeName(`${data.prenom} ${data.nom}`);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentEmployeeId) return;

    setLoading(true);
    try {
      const updatedComments = [
        ...(comments || []),
        {
          auteur_id: currentEmployeeId,
          auteur_nom: employeeName,
          texte: newComment,
          date: new Date().toISOString(),
        },
      ];

      const { error } = await supabase
        .from("tasks")
        .update({ commentaires: updatedComments })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Commentaire ajouté");
      setNewComment("");
      onUpdate();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-3">
        {comments && comments.length > 0 ? (
          comments.map((comment: any, index: number) => (
            <div key={index} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{comment.auteur_nom}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.date).toLocaleString("fr-FR")}
                </span>
              </div>
              <p className="text-sm">{comment.texte}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire</p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
        />
        <Button onClick={handleAddComment} disabled={loading || !newComment.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
