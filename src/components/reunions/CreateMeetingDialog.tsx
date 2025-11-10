import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AudioUploader } from "./AudioUploader";
import { LiveMeetingRecorder } from "./LiveMeetingRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Project {
  id: string;
  titre: string;
}

export const CreateMeetingDialog = ({ open, onOpenChange, onSuccess }: CreateMeetingDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showLiveRecorder, setShowLiveRecorder] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: "",
    titre: "",
    date_reunion: "",
    duree_minutes: "",
    participants: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, titre")
      .order("titre");
    
    setProjects(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let audio_url = null;

      // Upload audio file if provided
      if (audioFile) {
        const fileExt = audioFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("meetings")
          .upload(fileName, audioFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("meetings")
          .getPublicUrl(fileName);

        audio_url = publicUrl;
      }

      // Create meeting
      const { error } = await supabase.from("project_meetings").insert({
        project_id: formData.project_id,
        titre: formData.titre,
        date_reunion: formData.date_reunion,
        duree_minutes: parseInt(formData.duree_minutes),
        participants: formData.participants.split(",").map(p => p.trim()),
        notes: formData.notes,
        audio_url,
      });

      if (error) throw error;

      toast({
        title: "Réunion créée",
        description: audio_url 
          ? "La transcription sera disponible dans quelques minutes"
          : "Réunion enregistrée avec succès",
      });

      onSuccess();
      resetForm();
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la réunion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: "",
      titre: "",
      date_reunion: "",
      duree_minutes: "",
      participants: "",
      notes: "",
    });
    setAudioFile(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle réunion</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Importer un fichier</TabsTrigger>
              <TabsTrigger value="live">Enregistrer en direct</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Projet</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.titre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titre">Titre de la réunion</Label>
                  <Input
                    id="titre"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.date_reunion}
                      onChange={(e) => setFormData({ ...formData, date_reunion: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duree">Durée (minutes)</Label>
                    <Input
                      id="duree"
                      type="number"
                      value={formData.duree_minutes}
                      onChange={(e) => setFormData({ ...formData, duree_minutes: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Participants (séparés par des virgules)</Label>
                  <Input
                    id="participants"
                    value={formData.participants}
                    onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                    placeholder="Alice, Bob, Charlie"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <AudioUploader onFileSelected={setAudioFile} />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Création..." : "Créer la réunion"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="live" className="mt-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Lancez un enregistrement en direct avec marquage temporel des projets et tâches abordés.
                </p>
                <Button
                  onClick={() => {
                    setShowLiveRecorder(true);
                    onOpenChange(false);
                  }}
                  size="lg"
                >
                  Démarrer l'enregistrement
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <LiveMeetingRecorder
        open={showLiveRecorder}
        onOpenChange={setShowLiveRecorder}
        onSuccess={() => {
          setShowLiveRecorder(false);
          onSuccess?.();
        }}
      />
    </>
  );
};
