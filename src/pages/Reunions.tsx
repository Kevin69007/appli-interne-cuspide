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
  project?: {
    titre: string;
  };
}

const Reunions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("project_meetings")
        .select(`
          *,
          project:projects(titre)
        `)
        .order("date_reunion", { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réunions",
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
      title: "Réunion créée",
      description: "La réunion a été créée avec succès",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Chargement...</div>
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
              <h1 className="text-3xl font-bold">Réunions</h1>
              <p className="text-muted-foreground">
                Gérez vos réunions avec transcription automatique
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate("/reunions/admin")}>
                <Settings className="w-4 h-4 mr-2" />
                Permissions
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle réunion
              </Button>
            )}
          </div>
        </div>

        {/* Meetings list */}
        <MeetingsList 
          meetings={meetings} 
          onMeetingClick={(id) => navigate(`/reunions/${id}`)}
        />

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
