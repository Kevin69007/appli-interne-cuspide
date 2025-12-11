import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MeetingsList } from "@/components/reunions/MeetingsList";
import { CreateMeetingDialog } from "@/components/reunions/CreateMeetingDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ModuleHelpButton } from "@/components/communication/ModuleHelpButton";
import { useTranslation } from "react-i18next";

interface Meeting {
  id: string;
  project_id: string;
  titre: string;
  date_reunion: string;
  duree_minutes?: number;
  participants: any;
  transcription?: string;
  resume_ia?: string;
  audio_url?: string;
  fichier_audio_url?: string;
  created_at: string;
  deleted_at?: string;
  project?: {
    titre: string;
  };
}

const Reunions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const { t } = useTranslation(['meetings', 'common']);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [archivedMeetings, setArchivedMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const fetchMeetings = async () => {
    try {
      // Fetch active meetings (not deleted)
      const { data: activeData, error: activeError } = await supabase
        .from("project_meetings")
        .select(`
          *,
          project:projects(titre)
        `)
        .is("deleted_at", null)
        .order("date_reunion", { ascending: false });

      if (activeError) throw activeError;
      setMeetings(activeData || []);

      // Fetch archived meetings (deleted but not permanently removed)
      const { data: archivedData, error: archivedError } = await supabase
        .from("project_meetings")
        .select(`
          *,
          project:projects(titre)
        `)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (archivedError) throw archivedError;
      setArchivedMeetings(archivedData || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast({
        title: t('error'),
        description: t('errorLoading'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingCreated = () => {
    setCreateDialogOpen(false);
    fetchMeetings();
    toast({
      title: t('meetingCreated'),
      description: t('meetingCreated'),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <ModuleHelpButton moduleId="meetings" />
              </div>
              <p className="text-muted-foreground">
                {t('description')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate("/reunions/admin")}>
                <Settings className="w-4 h-4 mr-2" />
                {t('permissions')}
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('newMeeting')}
              </Button>
            )}
          </div>
        </div>

        {/* Meetings list */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active" className="flex items-center gap-2">
              {t('tabs.active')}
              <Badge variant="secondary">{meetings.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              {t('tabs.archived')}
              <Badge variant="secondary">{archivedMeetings.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <MeetingsList 
              meetings={meetings} 
              onMeetingClick={(id) => navigate(`/reunions/${id}`)}
              onRefresh={fetchMeetings}
              isArchived={false}
            />
          </TabsContent>

          <TabsContent value="archived">
            <MeetingsList 
              meetings={archivedMeetings} 
              onMeetingClick={(id) => navigate(`/reunions/${id}`)}
              onRefresh={fetchMeetings}
              isArchived={true}
            />
          </TabsContent>
        </Tabs>

        {/* Create dialog */}
        <CreateMeetingDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleMeetingCreated}
        />
      </div>
    </div>
  );
};

export default Reunions;