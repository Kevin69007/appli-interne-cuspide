import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TaskProjectLinkProps {
  taskId: string;
}

export const TaskProjectLink = ({ taskId }: TaskProjectLinkProps) => {
  const navigate = useNavigate();
  const [project, setProject] = useState<{ id: string; titre: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinkedProject();
  }, [taskId]);

  const fetchLinkedProject = async () => {
    try {
      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          project:projects!inner(id, titre)
        `)
        .eq("task_id", taskId)
        .maybeSingle();

      if (error) throw error;
      if (data?.project) {
        setProject(data.project as any);
      }
    } catch (error) {
      console.error("Error fetching linked project:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !project) return null;

  return (
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-accent"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/projets/${project.id}`);
      }}
    >
      <Briefcase className="h-3 w-3 mr-1" />
      Projet : {project.titre}
    </Badge>
  );
};
