import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayerDialog } from "./VideoPlayerDialog";

interface VideoTutorial {
  id: string;
  titre: string;
  video_url: string;
  description: string | null;
  created_at: string;
  is_active: boolean;
  module_key: string;
  require_confirmation?: boolean;
  type_destinataire?: string;
}

interface ModuleHelpButtonProps {
  moduleId: string;
  variant?: "icon" | "text";
}

export const ModuleHelpButton = ({ moduleId, variant = "icon" }: ModuleHelpButtonProps) => {
  const [tutorial, setTutorial] = useState<VideoTutorial | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    fetchTutorial();
  }, [moduleId]);

  const fetchTutorial = async () => {
    try {
      const { data } = await supabase
        .from("video_tutorials")
        .select("*")
        .eq("module_key", moduleId)
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