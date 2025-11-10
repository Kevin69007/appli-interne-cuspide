import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskCommentsHierarchicalProps {
  parentTask: any;
  currentEmployeeId: string | null;
  onUpdate: () => void;
}

export const TaskCommentsHierarchical = ({
  parentTask,
  currentEmployeeId,
  onUpdate,
}: TaskCommentsHierarchicalProps) => {
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [newComments, setNewComments] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    fetchSubTasksWithComments();
    fetchEmployeeName();
  }, [parentTask.id]);

  const fetchSubTasksWithComments = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id, titre, commentaires")
      .eq("parent_task_id", parentTask.id)
      .neq("statut", "annulee")
      .order("created_at");
    if (data) setSubTasks(data);
  };

  const fetchEmployeeName = async () => {
    if (!currentEmployeeId) return;
    const { data } = await supabase
      .from("employees")
      .select("nom, prenom")
      .eq("id", currentEmployeeId)
      .single();
    if (data) setEmployeeName(`${data.prenom} ${data.nom}`);
  };

  const handleAddComment = async (taskId: string) => {
    const comment = newComments[taskId];
    if (!comment?.trim() || !currentEmployeeId) return;

    setLoading(true);
    try {
      const { data: currentTask } = await supabase
        .from("tasks")
        .select("commentaires")
        .eq("id", taskId)
        .single();

      if (!currentTask) return;

      const existingComments = Array.isArray(currentTask.commentaires) ? currentTask.commentaires : [];
      const updatedComments = [
        ...existingComments,
        {
          auteur_id: currentEmployeeId,
          auteur_nom: employeeName,
          texte: comment,
          date: new Date().toISOString(),
        },
      ];

      const { error } = await supabase
        .from("tasks")
        .update({ 
          commentaires: updatedComments,
          last_progress_comment_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Commentaire ajouté");
      const updatedNewComments = { ...newComments };
      updatedNewComments[taskId] = "";
      setNewComments(updatedNewComments);
      onUpdate();
      if (taskId !== parentTask.id) {
        fetchSubTasksWithComments();
      }
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const renderComments = (comments: any[]) => {
    if (!comments || comments.length === 0) {
      return <p className="text-xs text-muted-foreground italic">Aucun commentaire</p>;
    }
    return comments
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((comment: any, index: number) => (
        <div key={index} className="border-l-2 border-primary/30 pl-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-xs">{comment.auteur_nom}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.date).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
          <p className="text-sm">{comment.texte}</p>
        </div>
      ));
  };

  const renderCommentForm = (taskId: string) => (
    <div className="flex gap-2 mt-2">
      <Textarea
        value={newComments[taskId] || ""}
        onChange={(e) => {
          const updatedComments = { ...newComments };
          updatedComments[taskId] = e.target.value;
          setNewComments(updatedComments);
        }}
        placeholder="Ajouter un commentaire..."
        className="min-h-[60px]"
      />
      <Button 
        onClick={() => handleAddComment(taskId)} 
        disabled={loading || !newComments[taskId]?.trim()} 
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 mt-4">
      {/* Commentaires de la tâche principale */}
      <div className="border rounded-lg p-4 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Tâche principale</h4>
          <Badge variant="outline" className="text-xs">
            {parentTask.commentaires?.length || 0}
          </Badge>
        </div>
        <div className="space-y-2">
          {renderComments(parentTask.commentaires || [])}
          {renderCommentForm(parentTask.id)}
        </div>
      </div>

      {/* Commentaires des sous-tâches */}
      {subTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">Commentaires des sous-tâches</h4>
          {subTasks.map((subTask) => (
            <div key={subTask.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h5 className="font-medium text-sm">{subTask.titre}</h5>
                <Badge variant="outline" className="text-xs">
                  {subTask.commentaires?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {renderComments(subTask.commentaires || [])}
                {renderCommentForm(subTask.id)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
