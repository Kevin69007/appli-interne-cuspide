import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayerDialog } from "./VideoPlayerDialog";
import { useEmployee } from "@/contexts/EmployeeContext";

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

const MAX_BLINK_COUNT = 5;

export const ModuleHelpButton = ({ moduleId, variant = "icon" }: ModuleHelpButtonProps) => {
  const [tutorial, setTutorial] = useState<VideoTutorial | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [shouldBlink, setShouldBlink] = useState(false);
  const { employee } = useEmployee();

  useEffect(() => {
    fetchTutorial();
  }, [moduleId]);

  useEffect(() => {
    if (!employee?.id || !tutorial) return;

    const storageKey = `module_visit_${employee.id}_${moduleId}`;
    const visitCount = parseInt(localStorage.getItem(storageKey) || "0", 10);

    if (visitCount < MAX_BLINK_COUNT) {
      setShouldBlink(true);
      localStorage.setItem(storageKey, String(visitCount + 1));
    } else {
      setShouldBlink(false);
    }
  }, [employee?.id, moduleId, tutorial]);

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

  const blinkClass = shouldBlink ? "animate-pulse text-destructive" : "";

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVideo(true)}
          title="Aide - Tutoriel vidéo"
          className={blinkClass}
        >
          <HelpCircle className={`h-5 w-5 ${shouldBlink ? "text-destructive" : ""}`} />
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowVideo(true)}
          className={blinkClass}
        >
          <HelpCircle className={`h-4 w-4 mr-2 ${shouldBlink ? "text-destructive" : ""}`} />
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