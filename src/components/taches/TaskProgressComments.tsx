import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare, User, Calendar } from "lucide-react";

interface ProgressComment {
  id: string;
  commentaire: string;
  pourcentage_avancement: number | null;
  date_avancement: string;
  created_at: string;
  employee: { nom: string; prenom: string };
}

interface TaskProgressCommentsProps {
  taskId: string;
  currentEmployeeId: string | null;
}

export const TaskProgressComments = ({
  taskId,
  currentEmployeeId,
}: TaskProgressCommentsProps) => {
  const [comments, setComments] = useState<ProgressComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    commentaire: "",
    pourcentage_avancement: "",
  });

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("task_progress_comments")
        .select(`
          *,
          employee:employees!task_progress_comments_employee_id_fkey(nom, prenom)
        `)
        .eq("task_id", taskId)
        .order("date_avancement", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching progress comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployeeId) {
      toast.error("Impossible d'ajouter un commentaire");
      return;
    }

    try {
      const { error } = await supabase.from("task_progress_comments").insert({
        task_id: taskId,
        employee_id: currentEmployeeId,
        commentaire: formData.commentaire,
        pourcentage_avancement: formData.pourcentage_avancement
          ? parseInt(formData.pourcentage_avancement)
          : null,
      });

      if (error) throw error;

      // Update task last comment date
      await supabase
        .from("tasks")
        .update({ dernier_commentaire_avancement: new Date().toISOString() })
        .eq("id", taskId);

      toast.success("Commentaire d'avancement ajouté");
      setFormData({ commentaire: "", pourcentage_avancement: "" });
      setShowForm(false);
      fetchComments();
    } catch (error) {
      console.error("Error adding progress comment:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Commentaires d'avancement
        </h3>
        {!showForm && currentEmployeeId && (
          <Button onClick={() => setShowForm(true)} size="sm">
            Ajouter un commentaire
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="commentaire">Commentaire *</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) =>
                  setFormData({ ...formData, commentaire: e.target.value })
                }
                placeholder="Décrivez l'avancement de la tâche..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="pourcentage">Pourcentage d'avancement (optionnel)</Label>
              <Input
                id="pourcentage"
                type="number"
                min="0"
                max="100"
                value={formData.pourcentage_avancement}
                onChange={(e) =>
                  setFormData({ ...formData, pourcentage_avancement: e.target.value })
                }
                placeholder="Ex: 75"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ commentaire: "", pourcentage_avancement: "" });
                }}
                size="sm"
              >
                Annuler
              </Button>
              <Button type="submit" size="sm">
                Ajouter
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Chargement...</p>
      ) : comments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun commentaire d'avancement</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {comment.employee.prenom} {comment.employee.nom}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(comment.date_avancement), "dd MMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>
              </div>

              <p className="text-sm mb-2">{comment.commentaire}</p>

              {comment.pourcentage_avancement !== null && (
                <div className="text-sm font-medium text-primary">
                  Avancement : {comment.pourcentage_avancement}%
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
