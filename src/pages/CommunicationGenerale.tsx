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
import { CreateIdeaDialog } from "@/components/ideas/CreateIdeaDialog";
import { IdeasList } from "@/components/ideas/IdeasList";
import { CreateSurveyDialog } from "@/components/surveys/CreateSurveyDialog";
import { SurveysList } from "@/components/surveys/SurveysList";
import { EmployeeSurveysList } from "@/components/surveys/EmployeeSurveysList";

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
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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
  }, [user, roleLoading, navigate]);

  const fetchCommunications = async () => {
    try {
      const { data } = await supabase
        .from("communications")
        .select("*")
        .order("created_at", { ascending: false });

      setCommunications(data || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
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
              <h1 className="text-2xl font-bold">Communication Générale</h1>
              <p className="text-sm text-muted-foreground">
                Communications, Enquêtes et Idées
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="communications" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="surveys">Enquêtes</TabsTrigger>
            <TabsTrigger value="ideas">Idées</TabsTrigger>
          </TabsList>

          <TabsContent value="communications" className="space-y-4 mt-6">
            {(isAdmin || isManager) && (
              <div className="flex justify-end">
                <Button onClick={() => setDialogOpen(true)}>
                  Nouvelle communication
                </Button>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
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
        </Tabs>
      </main>
    </div>
  );
};

export default CommunicationGenerale;
