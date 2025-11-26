import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface PriorityTask {
  id: string;
  titre: string;
  date_echeance: string;
  last_progress_comment_at: string | null;
  project_tasks?: Array<{
    project: {
      id: string;
      titre: string;
    };
  }>;
}

export const TachesPrioritairesWidget = ({ onDataLoaded }: { onDataLoaded?: (hasData: boolean) => void } = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('indicators');
  const [tasks, setTasks] = useState<PriorityTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentingTaskId, setCommentingTaskId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (user) {
      fetchPriorityTasks();
    }
  }, [user]);

  const fetchPriorityTasks = async () => {
    try {
      const { data: employeeData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!employeeData) return;

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          titre,
          date_echeance,
          last_progress_comment_at,
          project_tasks(
            project:projects!project_tasks_project_id_fkey(id, titre)
          )
        `)
        .eq("assigned_to", employeeData.id)
        .eq("is_priority", true)
        .in("statut", ["en_cours", "a_venir"])
        .order("date_echeance");

      if (error) throw error;
      setTasks(data || []);
      onDataLoaded?.((data || []).length > 0);
    } catch (error) {
      console.error("Error fetching priority tasks:", error);
      onDataLoaded?.(false);
    } finally {
      setLoading(false);
    }
  };

  const needsUpdate = (task: PriorityTask) => {
    if (!task.last_progress_comment_at) return true;
    const lastUpdate = new Date(task.last_progress_comment_at);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return lastUpdate < twoDaysAgo;
  };

  const handleAddComment = async (taskId: string) => {
    if (!comment.trim() || !user) return;

    try {
      const { data: employeeData } = await supabase
        .from("employees")
        .select("id, nom, prenom")
        .eq("user_id", user.id)
        .single();

      if (!employeeData) return;

      const { data: taskData } = await supabase
        .from("tasks")
        .select("commentaires")
        .eq("id", taskId)
        .single();

      const existingComments = Array.isArray(taskData?.commentaires) 
        ? taskData.commentaires 
        : [];

      const updatedComments = [
        ...existingComments,
        {
          auteur_id: employeeData.id,
          auteur_nom: `${employeeData.prenom} ${employeeData.nom}`,
          texte: comment,
          date: new Date().toISOString(),
        },
      ];

      const { error } = await supabase
        .from("tasks")
        .update({
          commentaires: updatedComments,
          last_progress_comment_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      toast.success(t('employee.priorityTasks.progressAdded'));
      setComment("");
      setCommentingTaskId(null);
      fetchPriorityTasks();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(t('employee.priorityTasks.addError'));
    }
  };

  if (loading) {
    return null;
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button, input")) {
          navigate("/taches");
        }
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {t('employee.priorityTasks.title')}
        </h3>
        <Badge variant="destructive">🔥 {tasks.length}</Badge>
      </div>

      <div className="space-y-3">
          {tasks.slice(0, 3).map((task) => {
      const projectData = task.project_tasks?.[0]?.project;
      const projectInfo = Array.isArray(projectData) && projectData.length > 0 
        ? projectData[0] 
        : projectData;
            const showWarning = needsUpdate(task);
            const isExpanded = commentingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-3 border rounded-lg ${
                  showWarning ? "border-orange-300 bg-orange-50" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.titre}</p>
                    {projectInfo && !Array.isArray(projectInfo) && (
                      <p className="text-xs text-muted-foreground">
                        {t('employee.priorityTasks.project')}: {projectInfo.titre}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      📅 {new Date(task.date_echeance).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {showWarning && (
                    <Badge variant="outline" className="text-xs bg-orange-100 border-orange-300">
                      ⚠️ {t('employee.priorityTasks.needsUpdate')}
                    </Badge>
                  )}
                </div>

                {!isExpanded ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCommentingTaskId(task.id);
                    }}
                  >
                    <MessageSquare className="h-3 w-3 mr-2" />
                    {t('employee.priorityTasks.addProgress')}
                  </Button>
                ) : (
                  <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder={t('employee.priorityTasks.progressPlaceholder')}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(task.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(task.id)}
                      disabled={!comment.trim()}
                      className="h-8"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </Card>
  );
};