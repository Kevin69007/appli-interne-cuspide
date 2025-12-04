import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface CreateVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isTutorial?: boolean;
}

export const CreateVideoDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  isTutorial = false 
}: CreateVideoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [teams, setTeams] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    video_url: "",
    type_destinataire: "tout_le_monde",
    equipes: [] as string[],
    groupes: [] as string[],
    destinataires_individuels: [] as string[],
    require_confirmation: false,
    date_expiration: "",
    module_id: ""
  });

  useEffect(() => {
    if (open) {
      fetchTeamsAndGroups();
      fetchEmployees();
    }
  }, [open]);

  const fetchTeamsAndGroups = async () => {
    try {
      const { data: empData } = await supabase
        .from("employees")
        .select("equipe, groupe");

      if (empData) {
        const uniqueTeams = [...new Set(empData.map(e => e.equipe).filter(Boolean))];
        const uniqueGroups = [...new Set(empData.map(e => e.groupe).filter(Boolean))];
        setTeams(uniqueTeams as string[]);
        setGroups(uniqueGroups as string[]);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from("employees")
        .select("id, nom, prenom")
        .order("nom");

      if (data) {
        setEmployees(
          data.map(emp => ({
            value: emp.id,
            label: `${emp.prenom} ${emp.nom}`
          }))
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type - accept common video MIME types
    const validVideoTypes = [
      "video/mp4",
      "video/mpeg",
      "video/webm",
      "video/x-msvideo", // .avi
      "video/quicktime", // .mov
      "video/x-m4v",
      "video/ogg",
      "video/3gpp",
      "video/x-matroska" // .mkv
    ];
    
    const isValidVideo = file.type.startsWith("video/") || validVideoTypes.includes(file.type);
    
    if (!isValidVideo) {
      toast({
        title: "Erreur",
        description: `Format non supporté: ${file.type || "inconnu"}. Formats acceptés: MP4, MPEG, WebM, AVI, MOV`,
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier est trop volumineux (max 100MB)",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate smooth progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until actual upload completes
        return prev + 10;
      });
    }, 300);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, video_url: publicUrl }));

      toast({
        title: "Vidéo téléchargée",
        description: "La vidéo a été téléchargée avec succès"
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la vidéo",
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer l'employee_id correspondant à l'utilisateur connecté
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employeeError || !employeeData) {
        throw new Error("Impossible de trouver votre profil employé");
      }

      const insertData: any = {
        titre: formData.titre,
        description: formData.description,
        video_url: formData.video_url,
        type_destinataire: formData.type_destinataire,
        equipes: formData.equipes.length > 0 ? formData.equipes : null,
        groupes: formData.groupes.length > 0 ? formData.groupes : null,
        employee_ids: formData.destinataires_individuels.length > 0 ? formData.destinataires_individuels : null,
        require_confirmation: formData.require_confirmation,
        date_expiration: formData.date_expiration || null,
        created_by: employeeData.id
      };

      const { error } = await supabase
        .from("video_communications")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: isTutorial ? "Tutoriel créé" : "Vidéo créée",
        description: isTutorial 
          ? "Le tutoriel vidéo a été créé avec succès"
          : "La vidéo a été envoyée avec succès"
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        titre: "",
        description: "",
        video_url: "",
        type_destinataire: "tout_le_monde",
        equipes: [],
        groupes: [],
        destinataires_individuels: [],
        require_confirmation: false,
        date_expiration: "",
        module_id: ""
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la vidéo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isTutorial ? "Nouveau Tutoriel Vidéo" : "Nouvelle Vidéo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="video">Vidéo *</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="video"
                  type="file"
                  accept="video/mp4,video/mpeg,video/webm,video/x-msvideo,video/quicktime,video/x-m4v,video/ogg,.mp4,.mpeg,.mpg,.webm,.avi,.mov,.m4v,.mkv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
              </div>
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {uploadProgress}% téléchargé
                  </p>
                </div>
              )}
              {formData.video_url && (
                <p className="text-sm text-green-600">✓ Vidéo téléchargée</p>
              )}
              <p className="text-xs text-muted-foreground">
                Formats acceptés: MP4, MPEG, WebM, AVI, MOV, MKV (max 100MB)
              </p>
            </div>
          </div>

          {isTutorial && (
            <div>
              <Label htmlFor="module_id">Module associé *</Label>
              <Input
                id="module_id"
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                placeholder="ex: taches, projets, planning"
                required={isTutorial}
              />
            </div>
          )}

          {!isTutorial && (
            <>
              <div>
                <Label htmlFor="type">Destinataires *</Label>
                <Select
                  value={formData.type_destinataire}
                  onValueChange={(value) => setFormData({ ...formData, type_destinataire: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tout_le_monde">Tout le monde</SelectItem>
                    <SelectItem value="selection_equipe">Sélection d'équipes</SelectItem>
                    <SelectItem value="groupe">Par groupe</SelectItem>
                    <SelectItem value="selection_individuelle">Sélection individuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type_destinataire === "selection_equipe" && (
                <div>
                  <Label>Équipes</Label>
                  <MultiSelect
                    selectedValues={formData.equipes}
                    onSelectedValuesChange={(values) => setFormData({ ...formData, equipes: values })}
                    options={teams.map(t => ({ value: t, label: t }))}
                    placeholder="Sélectionner des équipes"
                  />
                </div>
              )}

              {formData.type_destinataire === "groupe" && (
                <div>
                  <Label>Groupes</Label>
                  <MultiSelect
                    selectedValues={formData.groupes}
                    onSelectedValuesChange={(values) => setFormData({ ...formData, groupes: values })}
                    options={groups.map(g => ({ value: g, label: g }))}
                    placeholder="Sélectionner des groupes"
                  />
                </div>
              )}

              {formData.type_destinataire === "selection_individuelle" && (
                <div>
                  <Label>Employés</Label>
                  <MultiSelect
                    selectedValues={formData.destinataires_individuels}
                    onSelectedValuesChange={(values) => setFormData({ ...formData, destinataires_individuels: values })}
                    options={employees}
                    placeholder="Sélectionner des employés"
                    searchPlaceholder="Rechercher un employé..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="date_expiration">Date d'expiration (optionnel)</Label>
                <Input
                  id="date_expiration"
                  type="date"
                  value={formData.date_expiration}
                  onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="require_confirmation"
              checked={formData.require_confirmation}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, require_confirmation: checked as boolean })
              }
            />
            <Label htmlFor="require_confirmation" className="cursor-pointer">
              Demander une confirmation de visionnage
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || uploading || !formData.video_url}>
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};