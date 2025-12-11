import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AudioUploader } from "./AudioUploader";
import { LiveMeetingRecorder } from "./LiveMeetingRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTranslation } from "react-i18next";

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Project {
  id: string;
  titre: string;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

export const CreateMeetingDialog = ({ open, onOpenChange, onSuccess }: CreateMeetingDialogProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['meetings', 'common']);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showLiveRecorder, setShowLiveRecorder] = useState(false);
  
  const [formData, setFormData] = useState({
    project_ids: [] as string[],
    titre: "",
    date_reunion: "",
    participant_ids: [] as string[],
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchProjects();
      fetchEmployees();
    }
  }, [open]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, titre")
      .order("titre");
    
    console.log("=== PROJETS CHARGÉS ===", data);
    if (!data || data.length === 0) {
      toast({
        title: t('common:warning'),
        description: t('create.noProjectsAvailable'),
        variant: "destructive",
      });
    }
    setProjects(data || []);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom, prenom");
    
    console.log("=== EMPLOYÉS CHARGÉS ===", data);
    if (!data || data.length === 0) {
      toast({
        title: t('common:warning'),
        description: t('create.noEmployeesAvailable'),
        variant: "destructive",
      });
    }
    setEmployees(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== FORM SUBMIT ===");
    console.log("Form data:", formData);
    console.log("Audio file:", audioFile);
    
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

      // Validation des données avant insertion
      console.log("=== DEBUG CREATE MEETING ===");
      console.log("project_ids:", formData.project_ids, "Type:", typeof formData.project_ids, "Array:", Array.isArray(formData.project_ids));
      console.log("participant_ids:", formData.participant_ids, "Type:", typeof formData.participant_ids, "Array:", Array.isArray(formData.participant_ids));
      console.log("titre:", formData.titre);
      console.log("date_reunion:", formData.date_reunion);
      console.log("notes:", formData.notes);
      console.log("audio_url:", audio_url);

      if (!formData.project_ids || formData.project_ids.length === 0) {
        throw new Error(t('create.selectAtLeastOneProject'));
      }
      if (!formData.participant_ids || formData.participant_ids.length === 0) {
        throw new Error(t('create.selectAtLeastOneParticipant'));
      }
      if (!formData.titre || formData.titre.trim() === "") {
        throw new Error(t('create.titleRequired'));
      }
      if (!formData.date_reunion) {
        throw new Error(t('create.dateRequired'));
      }

      // Create meeting
      const { data: { user } } = await supabase.auth.getUser();
      const { data: insertData, error } = await supabase.from("project_meetings").insert({
        project_ids: formData.project_ids,
        titre: formData.titre,
        date_reunion: formData.date_reunion,
        participants: formData.participant_ids,
        notes: formData.notes,
        audio_url,
        created_by: user?.id,
      }).select();

      console.log("=== INSERT RESULT ===");
      console.log("Data:", insertData);
      console.log("Error:", error);

      if (error) throw error;

      toast({
        title: t('meetingCreated'),
        description: audio_url 
          ? t('create.transcriptionPending')
          : t('create.savedSuccess'),
      });

      onSuccess();
      resetForm();
    } catch (error) {
      console.error("=== ERROR CREATING MEETING ===");
      console.error("Full error:", error);
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      toast({
        title: t('create.errorCreating'),
        description: error instanceof Error ? error.message : t('create.unknownError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_ids: [],
      titre: "",
      date_reunion: "",
      participant_ids: [],
      notes: "",
    });
    setAudioFile(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto max-sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{t('create.title')}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="upload" className="text-xs sm:text-sm py-2">{t('upload.title')}</TabsTrigger>
              <TabsTrigger value="live" className="text-xs sm:text-sm py-2">{t('live.title')}</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="projects" className="text-sm">{t('create.projects')} *</Label>
                  <MultiSelect
                    selectedValues={formData.project_ids || []}
                    onSelectedValuesChange={(values) =>
                      setFormData({ ...formData, project_ids: values || [] })
                    }
                    options={(projects || []).map((p) => ({
                      value: p.id,
                      label: p.titre,
                    }))}
                    placeholder={t('create.selectProjects')}
                    searchPlaceholder={t('create.searchProject')}
                    emptyMessage={t('create.noProjectFound')}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="titre" className="text-sm">{t('meetingTitle')}</Label>
                  <Input
                    id="titre"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="date" className="text-sm">{t('meetingDate')}</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date_reunion}
                    onChange={(e) => setFormData({ ...formData, date_reunion: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="participants" className="text-sm">{t('participants')} *</Label>
                  <MultiSelect
                    selectedValues={formData.participant_ids || []}
                    onSelectedValuesChange={(values) =>
                      setFormData({ ...formData, participant_ids: values || [] })
                    }
                    options={(employees || []).map((emp) => ({
                      value: emp.id,
                      label: `${emp.prenom} ${emp.nom}`,
                    }))}
                    placeholder={t('create.selectParticipants')}
                    searchPlaceholder={t('create.searchEmployee')}
                    emptyMessage={t('create.noEmployeeFound')}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="notes" className="text-sm">{t('notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <AudioUploader onFileSelected={setAudioFile} />

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 sm:pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? t('creating') : t('createMeeting')}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="live" className="mt-3 sm:mt-4">
              <div className="text-center py-6 sm:py-8">
                <p className="text-muted-foreground mb-4 text-sm sm:text-base px-2">
                  {t('live.description')}
                </p>
                <Button
                  onClick={() => {
                    setShowLiveRecorder(true);
                    onOpenChange(false);
                  }}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {t('live.start')}
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