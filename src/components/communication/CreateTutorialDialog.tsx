import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Link as LinkIcon } from "lucide-react";

const MODULES = [
  { key: "tasks", label: "Tâches" },
  { key: "projects", label: "Projets" },
  { key: "planning", label: "Agenda / Planning" },
  { key: "rh", label: "Ressources Humaines" },
  { key: "meetings", label: "Réunions" },
  { key: "communication", label: "Communication" },
  { key: "direction", label: "Suivi Direction" },
  { key: "stock", label: "Stock / Commandes" },
  { key: "formation", label: "Formation" },
  { key: "indicators", label: "Indicateurs / Primes" },
  { key: "detente", label: "Détente" },
  { key: "protocols", label: "Protocoles" },
];

interface CreateTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateTutorialDialog = ({ open, onOpenChange, onSuccess }: CreateTutorialDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("url");
  const [formData, setFormData] = useState({
    module_key: "",
    titre: "",
    description: "",
    video_url: "",
    is_active: true,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez MP4, WebM, OGG, MOV ou AVI.");
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 100 MB. Utilisez plutôt un lien YouTube/Vimeo.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `tutorial_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);

      setFormData({ ...formData, video_url: urlData.publicUrl });
      setUploadProgress(100);
      toast.success("Vidéo uploadée avec succès");
    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast.error(`Erreur: ${error.message}. Essayez un lien YouTube/Vimeo.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.module_key || !formData.titre || !formData.video_url) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("video_tutorials").insert({
        module_key: formData.module_key,
        titre: formData.titre,
        description: formData.description || null,
        video_url: formData.video_url,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast.success("Tutoriel créé avec succès");
      onSuccess();
      onOpenChange(false);
      setFormData({
        module_key: "",
        titre: "",
        description: "",
        video_url: "",
        is_active: true,
      });
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la création du tutoriel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau tutoriel vidéo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module">Module *</Label>
            <Select
              value={formData.module_key}
              onValueChange={(value) => setFormData({ ...formData, module_key: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un module" />
              </SelectTrigger>
              <SelectContent>
                {MODULES.map((module) => (
                  <SelectItem key={module.key} value={module.key}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Comment créer une tâche"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description optionnelle du tutoriel"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Vidéo *</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={uploadMode === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => setUploadMode("url")}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Lien URL
              </Button>
              <Button
                type="button"
                variant={uploadMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setUploadMode("upload")}
              >
                <Upload className="h-4 w-4 mr-1" />
                Uploader
              </Button>
            </div>

            {uploadMode === "url" ? (
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
              />
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {formData.video_url && uploadMode === "upload" && (
                  <p className="text-xs text-green-600">✓ Vidéo uploadée</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Activer immédiatement</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? "Création..." : "Créer le tutoriel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
