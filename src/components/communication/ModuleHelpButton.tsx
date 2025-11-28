import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayerDialog } from "./VideoPlayerDialog";
import type { VideoCommunication } from "./VideosList";

interface ModuleHelpButtonProps {
  moduleId: string;
  variant?: "icon" | "text";
}

export const ModuleHelpButton = ({ moduleId, variant = "icon" }: ModuleHelpButtonProps) => {
  const [tutorial, setTutorial] = useState<VideoCommunication | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    fetchTutorial();
  }, [moduleId]);

  const fetchTutorial = async () => {
    try {
      const { data } = await supabase
        .from("video_communications")
        .select("*")
        .eq("module_id", moduleId)
        .eq("is_tutorial", true)
        .eq("is_active", true)
        .single();

      if (data) {
        setTutorial(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (!tutorial) return null;

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVideo(true)}
          title="Aide - Tutoriel vidéo"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowVideo(true)}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Besoin d'aide ?
        </Button>
      )}

      {showVideo && tutorial && (
        <VideoPlayerDialog
          video={tutorial}
          open={showVideo}
          onOpenChange={setShowVideo}
        />
      )}
    </>
  );
};