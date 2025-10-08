import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreateCommunicationDialog } from "@/components/communication/CreateCommunicationDialog";
import { CommunicationsList } from "@/components/communication/CommunicationsList";

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
  const { isAdmin, isManager } = useUserRole();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isAdmin && !isManager) {
      navigate("/");
      return;
    }

    fetchCommunications();
  }, [user, isAdmin, isManager, navigate]);

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

  if (!user || (!isAdmin && !isManager)) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                  Gérer les informations importantes
                </p>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle communication
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement...</p>
          ) : (
            <CommunicationsList 
              communications={communications}
              onRefresh={fetchCommunications}
            />
          )}
        </Card>
      </main>

      <CreateCommunicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCommunications}
      />
    </div>
  );
};

export default CommunicationGenerale;
