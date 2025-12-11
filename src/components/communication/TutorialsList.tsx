import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { VideoPlayerDialog } from "./VideoPlayerDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MODULE_LABELS: Record<string, string> = {
  tasks: "Tâches",
  projects: "Projets",
  planning: "Agenda / Planning",
  rh: "Ressources Humaines",
  meetings: "Réunions",
  communication: "Communication",
  direction: "Suivi Direction",
  stock: "Stock / Commandes",
  formation: "Formation",
  indicators: "Indicateurs / Primes",
  detente: "Détente",
  protocols: "Protocoles",
};

interface Tutorial {
  id: string;
  module_key: string;
  titre: string;
  description: string | null;
  video_url: string;
  is_active: boolean;
  created_at: string;
}

interface TutorialsListProps {
  onRefresh?: () => void;
}

export const TutorialsList = ({ onRefresh }: TutorialsListProps) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from("video_tutorials")
        .select("*")
        .order("module_key", { ascending: true });

      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des tutoriels");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("video_tutorials")
        .update({ is_active: !currentValue })
        .eq("id", id);

      if (error) throw error;

      setTutorials(tutorials.map(t => 
        t.id === id ? { ...t, is_active: !currentValue } : t
      ));
      toast.success(`Tutoriel ${!currentValue ? "activé" : "désactivé"}`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("video_tutorials")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setTutorials(tutorials.filter(t => t.id !== deleteId));
      toast.success("Tutoriel supprimé");
      setDeleteId(null);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chargement des tutoriels...
      </div>
    );
  }

  if (tutorials.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Aucun tutoriel créé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Les tutoriels apparaîtront dans chaque module avec un bouton d'aide
        </p>
      </div>
    );
  }

  // Grouper par module
  const groupedByModule = tutorials.reduce((acc, tutorial) => {
    const key = tutorial.module_key;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tutorial);
    return acc;
  }, {} as Record<string, Tutorial[]>);

  return (
    <div className="space-y-4 sm:space-y-6">
      {Object.entries(groupedByModule).map(([moduleKey, moduleTutorials]) => (
        <div key={moduleKey}>
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
            {MODULE_LABELS[moduleKey] || moduleKey}
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {moduleTutorials.map((tutorial) => (
              <Card key={tutorial.id} className={!tutorial.is_active ? "opacity-60" : ""}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">{tutorial.titre}</h4>
                        <Badge variant={tutorial.is_active ? "default" : "secondary"} className="text-xs">
                          {tutorial.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      {tutorial.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {tutorial.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedTutorial(tutorial);
                          setShowVideo(true);
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={tutorial.is_active}
                        onCheckedChange={() => toggleActive(tutorial.id, tutorial.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(tutorial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {selectedTutorial && (
        <VideoPlayerDialog
          video={selectedTutorial}
          open={showVideo}
          onOpenChange={setShowVideo}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Supprimer ce tutoriel ?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Cette action est irréversible. Le bouton d'aide disparaîtra du module concerné.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
