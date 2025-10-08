import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, AlertCircle, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employee_id: string;
  date: string;
  type_absence: string;
  detail: string;
  statut_validation: string;
  employees: { nom: string; prenom: string; equipe: string };
}

interface MoodEntry {
  id: string;
  employee_id: string;
  mood_note: number;
  mood_commentaire: string;
  date_reponse: string;
  employees: { nom: string; prenom: string };
}

const CongesMoodBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager, loading: roleLoading } = useUserRole();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allAbsences, setAllAbsences] = useState<any[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!roleLoading && !isAdmin && !isManager) {
      toast.error("Accès refusé");
      navigate("/");
      return;
    }

    if (isAdmin || isManager) {
      fetchData();
    }
  }, [user, isAdmin, isManager, roleLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Demandes de congés en attente
      const { data: pendingLeaves, error: leavesError } = await supabase
        .from("agenda_entries")
        .select("id, employee_id, date, type_absence, detail, statut_validation, employees(nom, prenom, equipe)")
        .eq("categorie", "absence")
        .eq("type_absence", "demande_conges")
        .eq("statut_validation", "en_attente")
        .order("date", { ascending: true });

      if (leavesError) throw leavesError;

      // Toutes les absences
      const { data: absences, error: absencesError } = await supabase
        .from("agenda_entries")
        .select("id, employee_id, date, type_absence, detail, statut_validation, employees(nom, prenom, equipe)")
        .eq("categorie", "absence")
        .order("date", { ascending: false });

      if (absencesError) throw absencesError;

      // Mood bar (quiz responses avec mood)
      const { data: moods, error: moodsError } = await supabase
        .from("quiz_responses")
        .select("id, employee_id, mood_note, mood_commentaire, date_reponse, employees!quiz_responses_employee_id_fkey(nom, prenom)")
        .not("mood_note", "is", null)
        .order("date_reponse", { ascending: false })
        .limit(50);

      if (moodsError) throw moodsError;

      setLeaveRequests(pendingLeaves || []);
      setAllAbsences(absences || []);
      setMoodEntries(moods || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveValidation = async (leaveId: string, approved: boolean) => {
    const { error } = await supabase
      .from("agenda_entries")
      .update({ statut_validation: approved ? "valide" : "refuse" })
      .eq("id", leaveId);

    if (error) {
      toast.error("Erreur lors de la validation");
      return;
    }

    toast.success(approved ? "Demande approuvée" : "Demande refusée");
    fetchData();
  };

  const getAbsenceTypeLabel = (type: string) => {
    switch (type) {
      case "demande_conges":
        return "Congés";
      case "arret_maladie":
        return "Arrêt maladie";
      case "injustifie":
        return "Injustifié";
      default:
        return type;
    }
  };

  const getMoodColor = (note: number) => {
    if (note <= 2) return "text-red-600";
    if (note <= 3) return "text-orange-600";
    return "text-green-600";
  };

  const lowMoodAlerts = moodEntries.filter((m) => m.mood_note <= 2);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Congés & Mood Bar</h1>
        </div>

        <Tabs defaultValue="leave-requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leave-requests">
              Demandes de congés ({leaveRequests.length})
            </TabsTrigger>
            <TabsTrigger value="absences">Récapitulatif absences</TabsTrigger>
            <TabsTrigger value="mood">
              Mood Bar {lowMoodAlerts.length > 0 && `(${lowMoodAlerts.length} alertes)`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leave-requests" className="space-y-4 mt-6">
            {leaveRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune demande en attente
              </p>
            ) : (
              leaveRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {request.employees.prenom} {request.employees.nom}
                      </span>
                      <Badge>{request.employees.equipe}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 text-sm">
                      <div>
                        <strong>Date :</strong> {new Date(request.date).toLocaleDateString("fr-FR")}
                      </div>
                      {request.detail && (
                        <div>
                          <strong>Détails :</strong> {request.detail}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleLeaveValidation(request.id, true)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleLeaveValidation(request.id, false)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="absences" className="space-y-4 mt-6">
            <div className="grid gap-2">
              {allAbsences.map((absence) => (
                <div key={absence.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {absence.employees?.prenom} {absence.employees?.nom}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(absence.date).toLocaleDateString("fr-FR")} -{" "}
                      {getAbsenceTypeLabel(absence.type_absence)}
                    </div>
                    {absence.detail && (
                      <div className="text-sm text-muted-foreground mt-1">{absence.detail}</div>
                    )}
                  </div>
                  <Badge
                    variant={
                      absence.statut_validation === "valide"
                        ? "default"
                        : absence.statut_validation === "refuse"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {absence.statut_validation}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mood" className="space-y-4 mt-6">
            {lowMoodAlerts.length > 0 && (
              <Card className="border-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Alertes Mood Bas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {lowMoodAlerts.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="border-l-4 border-red-500 pl-3 py-2">
                      <div className="font-medium">
                        {entry.employees.prenom} {entry.employees.nom}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Note : {entry.mood_note}/5 -{" "}
                        {new Date(entry.date_reponse).toLocaleDateString("fr-FR")}
                      </div>
                      {entry.mood_commentaire && (
                        <div className="text-sm italic mt-1">"{entry.mood_commentaire}"</div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Historique Mood</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {moodEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {entry.employees.prenom} {entry.employees.nom}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.date_reponse).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${getMoodColor(entry.mood_note)}`}>
                        {entry.mood_note}/5
                      </div>
                    </div>
                    {entry.mood_commentaire && (
                      <div className="text-sm text-muted-foreground mt-2 italic">
                        "{entry.mood_commentaire}"
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CongesMoodBar;
