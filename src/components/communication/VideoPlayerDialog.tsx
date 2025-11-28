import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle } from "lucide-react";
import type { VideoCommunication } from "./VideosList";

interface VideoPlayerDialogProps {
  video: VideoCommunication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoComplete?: () => void;
}

export const VideoPlayerDialog = ({ 
  video, 
  open, 
  onOpenChange,
  onVideoComplete 
}: VideoPlayerDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasWatched, setHasWatched] = useState(false);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [alreadyViewed, setAlreadyViewed] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchEmployeeAndCheckView = async () => {
      const { data: empData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (empData) {
        setEmployeeId(empData.id);

        // Check if already viewed
        const { data: viewData } = await supabase
          .from("video_views")
          .select("id")
          .eq("video_id", video.id)
          .eq("employee_id", empData.id)
          .single();

        if (viewData) {
          setAlreadyViewed(true);
          setHasWatched(true);
        }
      }
    };

    fetchEmployeeAndCheckView();
  }, [user, video.id]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const percentage = (videoElement.currentTime / videoElement.duration) * 100;
      setWatchedPercentage(percentage);

      // Consider watched if 90% complete
      if (percentage >= 90 && !hasWatched) {
        setHasWatched(true);
      }
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => videoElement.removeEventListener("timeupdate", handleTimeUpdate);
  }, [hasWatched]);

  const handleConfirmView = async () => {
    if (!employeeId || alreadyViewed) return;

    try {
      const { error } = await supabase
        .from("video_views")
        .insert({
          video_id: video.id,
          employee_id: employeeId,
          watched_duration: videoRef.current?.currentTime || 0,
          completion_percentage: watchedPercentage
        });

      if (error) throw error;

      toast({
        title: "Visionnage confirmé",
        description: "Votre visionnage a été enregistré avec succès"
      });

      setAlreadyViewed(true);
      onVideoComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le visionnage",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{video.titre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {video.description && (
            <p className="text-sm text-muted-foreground">{video.description}</p>
          )}

          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              controls
              className="w-full h-full"
              src={video.video_url}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>

          {video.require_confirmation && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">
                  Progression: {Math.round(watchedPercentage)}%
                </span>
                {hasWatched && !alreadyViewed && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Visionnage complet
                  </span>
                )}
                {alreadyViewed && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Déjà confirmé
                  </span>
                )}
              </div>

              <Button
                onClick={handleConfirmView}
                disabled={!hasWatched || alreadyViewed}
                className="w-full"
              >
                {alreadyViewed 
                  ? "Visionnage déjà confirmé" 
                  : hasWatched 
                  ? "Confirmer le visionnage" 
                  : "Regardez au moins 90% de la vidéo pour confirmer"
                }
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};