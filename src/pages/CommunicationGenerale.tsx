import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { CommunicationsList } from "@/components/communication/CommunicationsList";
import { CreateCommunicationDialog } from "@/components/communication/CreateCommunicationDialog";
import { VideosList } from "@/components/communication/VideosList";
import { CreateVideoDialog } from "@/components/communication/CreateVideoDialog";
import { CreateTutorialDialog } from "@/components/communication/CreateTutorialDialog";
import { TutorialsList } from "@/components/communication/TutorialsList";
import type { VideoCommunication } from "@/components/communication/VideosList";
import { CreateIdeaDialog } from "@/components/ideas/CreateIdeaDialog";
import { IdeasList } from "@/components/ideas/IdeasList";
import { CreateSurveyDialog } from "@/components/surveys/CreateSurveyDialog";
import { SurveysList } from "@/components/surveys/SurveysList";
import { EmployeeSurveysList } from "@/components/surveys/EmployeeSurveysList";
import { useTranslation } from "react-i18next";

export interface Communication {
  id: string;
  titre: string;
  contenu: string;
  created_at: string;
  type_destinataire: string;
  equipes?: string[];
  groupes?: string[];
  require_confirmation: boolean;
  show_in_calendar: boolean;
  date_expiration?: string;
  is_active: boolean;
  lectures_count?: number;
  total_destinataires?: number;
}

const CommunicationGenerale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager, loading: roleLoading } = useUserRole();
  const { t } = useTranslation(['communication', 'common']);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [videos, setVideos] = useState<VideoCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [tutorialRefreshKey, setTutorialRefreshKey] = useState(0);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (roleLoading) return;

    const fetchEmployee = async () => {
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setEmployeeId(data.id);
      }
    };

    fetchEmployee();
    fetchCommunications();
    fetchVideos();
  }, [user, roleLoading, navigate]);

  const fetchCommunications = async () => {
    try {
      const { data } = await supabase
        .from("communications")
        .select("*")
        .order("created_at", { ascending: false });

      setCommunications(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data } = await supabase
        .from("video_communications")
        .select("*")
        .order("created_at", { ascending: false });

      setVideos(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (!user || roleLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="communications" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="communications">{t('tabs.communications')}</TabsTrigger>
            <TabsTrigger value="videos">{t('tabs.videos')}</TabsTrigger>
            <TabsTrigger value="surveys">{t('tabs.surveys')}</TabsTrigger>
            <TabsTrigger value="ideas">{t('tabs.ideas')}</TabsTrigger>
            {isAdmin && <TabsTrigger value="tutorials">{t('tabs.tutorials')}</TabsTrigger>}
          </TabsList>

          <TabsContent value="communications" className="space-y-4 mt-6">
            {(isAdmin || isManager) && (
              <div className="flex justify-end">
                <Button onClick={() => setDialogOpen(true)}>
                  {t('newCommunication')}
                </Button>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('loading')}</p>
              </div>
            ) : (
              <CommunicationsList 
                communications={communications}
                onRefresh={fetchCommunications}
              />
            )}

            <CreateCommunicationDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onSuccess={fetchCommunications}
            />
          </TabsContent>

          <TabsContent value="videos" className="space-y-4 mt-6">
            {(isAdmin || isManager) && (
              <div className="flex justify-end">
                <Button onClick={() => setVideoDialogOpen(true)}>
                  {t('newVideo')}
                </Button>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('loading')}</p>
              </div>
            ) : (
              <VideosList 
                videos={videos}
                onRefresh={fetchVideos}
              />
            )}

            <CreateVideoDialog
              open={videoDialogOpen}
              onOpenChange={setVideoDialogOpen}
              onSuccess={fetchVideos}
            />
          </TabsContent>

          <TabsContent value="surveys" className="space-y-4 mt-6">
            {isAdmin || isManager ? (
              <>
                <div className="flex justify-end">
                  <CreateSurveyDialog onSurveyCreated={() => {}} />
                </div>
                <SurveysList />
              </>
            ) : (
              <EmployeeSurveysList employeeId={employeeId} />
            )}
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <CreateIdeaDialog employeeId={employeeId} onIdeaCreated={() => {}} />
            </div>
            <IdeasList isManager={isAdmin || isManager} employeeId={employeeId} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="tutorials" className="space-y-4 mt-6">
              <div className="flex justify-end">
                <Button onClick={() => setTutorialDialogOpen(true)}>
                  {t('newTutorial')}
                </Button>
              </div>
              <TutorialsList key={tutorialRefreshKey} />
              <CreateTutorialDialog
                open={tutorialDialogOpen}
                onOpenChange={setTutorialDialogOpen}
                onSuccess={() => setTutorialRefreshKey(k => k + 1)}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default CommunicationGenerale;