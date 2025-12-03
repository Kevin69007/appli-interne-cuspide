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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
      variant="glass"
      className="p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-shadow hover-3d animate-fade-in"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button, input")) {
          navigate("/taches");
        }
      }}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-base sm:text-lg font-display flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
          <span className="line-clamp-1">{t('employee.priorityTasks.title')}</span>
        </h3>
        <Badge variant="destructive" className="shrink-0">🔥 {tasks.length}</Badge>
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
                className={`p-2 border rounded-lg glass border-border/50 hover:border-primary/50 transition-all animate-fade-in ${
                  showWarning ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : ""
                }`}
                style={{ animationDelay: `${tasks.indexOf(task) * 100}ms` }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-medium text-xs leading-snug line-clamp-3 cursor-default flex-1">
                            {task.titre}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[300px]">
                          <p>{task.titre}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {showWarning && (
                      <span className="text-orange-500 shrink-0 text-xs" title={t('employee.priorityTasks.needsUpdate')}>⚠️</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                    <span>{new Date(task.date_echeance).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' })}</span>
                    {projectInfo && !Array.isArray(projectInfo) && (
                      <span className="truncate max-w-[60px]">• {projectInfo.titre}</span>
                    )}
                  </div>
                </div>

                {!isExpanded ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1.5 h-6 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCommentingTaskId(task.id);
                    }}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Progression
                  </Button>
                ) : (
                  <div className="mt-1.5 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Avancement..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="h-6 text-[10px] flex-1"
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
                      className="h-6 px-2"
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