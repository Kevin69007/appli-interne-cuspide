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
import { Trombinoscope } from "@/components/rh/Trombinoscope";

interface LeaveRequest {
  id: string;
  employee_id: string;
  date: string;
  type_absence: string;
  detail: string;
  statut_validation: string;
  employees: { nom: string; prenom: string; equipe: string };
}

interface Absence {
  id: string;
  employee_id: string;
  date: string;
  type_absence: string;
  detail: string;
  statut_validation: string;
  valide_par: string | null;
  date_validation: string | null;
  employees: { nom: string; prenom: string; equipe: string };
  validator?: { email: string } | null;
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
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
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

      // Toutes les absences avec info validation
      const { data: absences, error: absencesError } = await supabase
        .from("agenda_entries")
        .select(`
          id, employee_id, date, type_absence, detail, statut_validation,
          valide_par, date_validation,
          employees(nom, prenom, equipe)
        `)
        .eq("categorie", "absence")
        .order("date", { ascending: false });

      if (absencesError) throw absencesError;

      // Récupérer les emails des validateurs
      const validatorIds = [...new Set(absences?.map(a => a.valide_par).filter(Boolean) as string[])];
      let validatorEmails: Record<string, string> = {};
      
      if (validatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", validatorIds);
        
        if (profiles) {
          validatorEmails = profiles.reduce((acc, p) => ({ ...acc, [p.user_id]: p.email }), {});
        }
      }

      // Ajouter les emails aux absences
      const absencesWithValidators = absences?.map(absence => ({
        ...absence,
        validator: absence.valide_par ? { email: validatorEmails[absence.valide_par] || "N/A" } : null
      })) || [];

      // Mood bar (quiz responses avec mood)
      const { data: moods, error: moodsError } = await supabase
        .from("quiz_responses")
        .select("id, employee_id, mood_note, mood_commentaire, date_reponse, employees!quiz_responses_employee_id_fkey(nom, prenom)")
        .not("mood_note", "is", null)
        .order("date_reponse", { ascending: false })
        .limit(50);

      if (moodsError) throw moodsError;

      setLeaveRequests(pendingLeaves || []);
      setAllAbsences(absencesWithValidators);
      setMoodEntries(moods || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveValidation = async (leaveId: string, approved: boolean) => {
    try {
      // Get the original leave request to extract dates
      const { data: originalRequest, error: fetchError } = await supabase
        .from("agenda_entries")
        .select("*")
        .eq("id", leaveId)
        .single();

      if (fetchError || !originalRequest) {
        toast.error("Erreur lors de la récupération de la demande");
        return;
      }

      // Update the original request status with validation info
      const { error: updateError } = await supabase
        .from("agenda_entries")
        .update({ 
          statut_validation: approved ? "valide" : "refuse",
          valide_par: user?.id,
          date_validation: new Date().toISOString()
        })
        .eq("id", leaveId);

      if (updateError) {
        toast.error("Erreur lors de la validation");
        return;
      }

      // If approved and there's a duration, create entries for all days in the period
      if (approved && originalRequest.duree_minutes) {
        const workDays = Math.round(originalRequest.duree_minutes / (8 * 60));
        
        // Extract dates from detail if formatted as "Du XX/XX/XXXX au XX/XX/XXXX"
        const detailMatch = originalRequest.detail?.match(/Du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
        
        if (detailMatch && workDays > 1) {
          const [_, startStr, endStr] = detailMatch;
          const [startDay, startMonth, startYear] = startStr.split('/');
          const [endDay, endMonth, endYear] = endStr.split('/');
          
          const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
          const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

          // Create entries for ALL days in the range (except the first day which already exists)
          // Including weekends to show full vacation period
          const entriesToCreate = [];
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + 1); // Start from day 2

          while (currentDate <= endDate) {
            entriesToCreate.push({
              employee_id: originalRequest.employee_id,
              date: currentDate.toISOString().split('T')[0],
              categorie: 'absence',
              type_absence: originalRequest.type_absence,
              detail: originalRequest.detail,
              statut_validation: 'valide',
              valide_par: user?.id,
              date_validation: new Date().toISOString(),
              points: 0
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }

          if (entriesToCreate.length > 0) {
            const { error: insertError } = await supabase
              .from("agenda_entries")
              .insert(entriesToCreate);

            if (insertError) {
              console.error("Error creating additional entries:", insertError);
              toast.warning("Demande approuvée mais erreur lors de la création des jours supplémentaires");
            }
          }
        }
      }

      toast.success(approved ? "Demande approuvée et jours ajoutés au calendrier" : "Demande refusée");
      fetchData();
    } catch (error) {
      console.error("Error validating leave:", error);
      toast.error("Erreur lors de la validation");
    }
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
          <h1 className="text-3xl font-bold">RH</h1>
        </div>

        <Tabs defaultValue="leave-requests" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="leave-requests">
              Demandes de congés ({leaveRequests.length})
            </TabsTrigger>
            <TabsTrigger value="absences">Récapitulatif absences</TabsTrigger>
            <TabsTrigger value="mood">
              Mood Bar {lowMoodAlerts.length > 0 && `(${lowMoodAlerts.length} alertes)`}
            </TabsTrigger>
            <TabsTrigger value="trombinoscope">Trombinoscope</TabsTrigger>
            <TabsTrigger value="payslips">Accès aux fiches de paie</TabsTrigger>
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
                <Card key={absence.id}>
                  <CardContent className="p-4 flex items-center justify-between">
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
                      {absence.statut_validation === "valide" && absence.date_validation && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Validé par {absence.validator?.email || "N/A"} le{" "}
                          {new Date(absence.date_validation).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
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
                      {absence.statut_validation === "valide" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveValidation(absence.id, false)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Révoquer
                        </Button>
                      )}
                      {absence.statut_validation === "refuse" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveValidation(absence.id, true)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approuver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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

          <TabsContent value="trombinoscope" className="space-y-4 mt-6">
            <Trombinoscope />
          </TabsContent>

          <TabsContent value="payslips" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Accès aux fiches de paie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Consultez vos fiches de paie sur la plateforme Silae.
                </p>
                <Button 
                  onClick={() => window.open("https://my.silae.fr/sign-in", "_blank")}
                  className="w-full"
                >
                  Accéder à Silae
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CongesMoodBar;
