import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEmployee } from "@/contexts/EmployeeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Trombinoscope } from "@/components/rh/Trombinoscope";
import { CreateLeaveRequestDialog } from "@/components/rh/CreateLeaveRequestDialog";
import { LeaveBalanceCard } from "@/components/rh/LeaveBalanceCard";
import { LeaveRequestBalanceInfo } from "@/components/rh/LeaveRequestBalanceInfo";
import { LeaveConfigPanel } from "@/components/rh/LeaveConfigPanel";

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
  mood_emoji: string;
  mood_label: string;
  date: string;
  need_type: string | null;
  employees: { nom: string; prenom: string };
}

const CongesMoodBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager, loading: roleLoading } = useUserRole();
  const { employee } = useEmployee();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminOrManager = isAdmin || isManager;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Fetch data when role is determined (for all users, not just admin/manager)
    if (!roleLoading) {
      fetchData();
    }
  }, [user, isAdmin, isManager, roleLoading, navigate, employee?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const employeeFilter = (!isAdminOrManager && employee?.id) ? employee.id : null;

      // Demandes de congés
      let leaveQuery = supabase
        .from("agenda_entries")
        .select("id, employee_id, date, type_absence, detail, statut_validation, employees(nom, prenom, equipe)")
        .eq("categorie", "absence")
        .eq("type_absence", "demande_conges");

      if (employeeFilter) {
        // Employé: voir toutes ses propres demandes (tous statuts)
        leaveQuery = leaveQuery.eq("employee_id", employeeFilter);
      } else {
        // Admin/Manager: voir seulement les demandes en attente
        leaveQuery = leaveQuery.eq("statut_validation", "en_attente");
      }

      const { data: pendingLeaves, error: leavesError } = await leaveQuery.order("date", { ascending: true });
      if (leavesError) throw leavesError;

      // Toutes les absences avec info validation
      let absencesQuery = supabase
        .from("agenda_entries")
        .select(`
          id, employee_id, date, type_absence, detail, statut_validation,
          valide_par, date_validation,
          employees(nom, prenom, equipe)
        `)
        .eq("categorie", "absence");

      if (employeeFilter) {
        absencesQuery = absencesQuery.eq("employee_id", employeeFilter);
      }

      const { data: absences, error: absencesError } = await absencesQuery.order("date", { ascending: false });
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

      // Mood bar (utiliser daily_mood au lieu de quiz_responses)
      let moodQuery = supabase
        .from("daily_mood")
        .select("id, employee_id, mood_emoji, mood_label, date, need_type, employees(nom, prenom)");

      if (employeeFilter) {
        moodQuery = moodQuery.eq("employee_id", employeeFilter);
      }

      const { data: moods, error: moodsError } = await moodQuery
        .order("date", { ascending: false })
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
      // Get the original leave request to extract dates and detail
      const { data: originalRequest, error: fetchError } = await supabase
        .from("agenda_entries")
        .select("*")
        .eq("id", leaveId)
        .single();

      if (fetchError || !originalRequest) {
        toast.error("Erreur lors de la récupération de la demande");
        return;
      }

      // Update ALL entries with the same detail and employee_id (bulk update)
      // This handles the new system where entries are created for each day at request time
      const { error: updateError } = await supabase
        .from("agenda_entries")
        .update({ 
          statut_validation: approved ? "valide" : "refuse",
          valide_par: user?.id,
          date_validation: new Date().toISOString()
        })
        .eq("employee_id", originalRequest.employee_id)
        .eq("detail", originalRequest.detail)
        .eq("statut_validation", "en_attente");

      if (updateError) {
        toast.error("Erreur lors de la validation");
        return;
      }

      toast.success(approved ? "Demande approuvée" : "Demande refusée");
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

  const getMoodEmoji = (emoji: string) => {
    return emoji || "😐";
  };

  const getLowMoodAlerts = () => {
    // Alertes pour mood bas (😔 ou 😐)
    return moodEntries.filter((m) => m.mood_emoji === "😔" || m.mood_label === "Pas bien");
  };

  const lowMoodAlerts = isAdminOrManager ? getLowMoodAlerts() : [];

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
          <h1 className="text-3xl font-bold">Ressources Humaines</h1>
        </div>

        <Tabs defaultValue={isAdminOrManager ? "leave-requests" : "my-requests"} className="w-full">
          <TabsList className={`grid w-full ${isAdminOrManager ? 'grid-cols-6' : 'grid-cols-4'}`}>
            {isAdminOrManager ? (
              <>
                <TabsTrigger value="leave-requests">
                  Demandes ({leaveRequests.length})
                </TabsTrigger>
                <TabsTrigger value="absences">Absences</TabsTrigger>
                <TabsTrigger value="mood">
                  Mood {lowMoodAlerts.length > 0 && `(${lowMoodAlerts.length})`}
                </TabsTrigger>
                <TabsTrigger value="leave-config">Config. congés</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="my-requests">
                  Mes demandes ({leaveRequests.length})
                </TabsTrigger>
                <TabsTrigger value="my-absences">Mes absences</TabsTrigger>
                <TabsTrigger value="my-mood">Mon humeur</TabsTrigger>
              </>
            )}
            <TabsTrigger value="trombinoscope">Trombinoscope</TabsTrigger>
            <TabsTrigger value="payslips">Fiches de paie</TabsTrigger>
          </TabsList>

          {/* Admin/Manager: Demandes de congés avec actions */}
          {isAdminOrManager && (
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
                      
                      {/* Soldes avant/après pour admin/manager */}
                      {request.detail && (
                        <LeaveRequestBalanceInfo 
                          employeeId={request.employee_id} 
                          requestDetail={request.detail} 
                        />
                      )}
                      
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
          )}

          {/* Employé: Mes demandes avec bouton de création */}
          {!isAdminOrManager && employee?.id && (
            <TabsContent value="my-requests" className="space-y-4 mt-6">
              {/* Widget solde de congés pour l'employé */}
              <LeaveBalanceCard 
                employeeId={employee.id} 
                compact 
                showPendingLink 
              />
              
              <div className="flex justify-end mb-4">
                <CreateLeaveRequestDialog employeeId={employee.id} onSuccess={fetchData} />
              </div>
              {leaveRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune demande de congés. Créez votre première demande !
                </p>
              ) : (
                leaveRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {new Date(request.date).toLocaleDateString("fr-FR")}
                          </div>
                          {request.detail && (
                            <div className="text-sm text-muted-foreground mt-1">{request.detail}</div>
                          )}
                        </div>
                        <Badge
                          variant={
                            request.statut_validation === "valide"
                              ? "default"
                              : request.statut_validation === "refuse"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {request.statut_validation === "en_attente" ? "En attente" : 
                           request.statut_validation === "valide" ? "Approuvée" : "Refusée"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          {/* Admin/Manager: Récapitulatif absences avec actions */}
          {isAdminOrManager && (
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
          )}

          {/* Employé: Mes absences (lecture seule) */}
          {!isAdminOrManager && (
            <TabsContent value="my-absences" className="space-y-4 mt-6">
              {allAbsences.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune absence enregistrée
                </p>
              ) : (
                <div className="grid gap-2">
                  {allAbsences.map((absence) => (
                    <Card key={absence.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
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
                          {absence.statut_validation === "valide" ? "Validée" : 
                           absence.statut_validation === "refuse" ? "Refusée" : "En attente"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Admin/Manager: Mood Bar avec alertes */}
          {isAdminOrManager && (
            <TabsContent value="mood" className="space-y-4 mt-6">
              {lowMoodAlerts.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      Alertes Mood Bas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lowMoodAlerts.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="border-l-4 border-destructive pl-3 py-2">
                        <div className="font-medium">
                          {entry.employees?.prenom} {entry.employees?.nom}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getMoodEmoji(entry.mood_emoji)} {entry.mood_label} -{" "}
                          {new Date(entry.date).toLocaleDateString("fr-FR")}
                        </div>
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
                  {moodEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Aucun enregistrement mood
                    </p>
                  ) : (
                    moodEntries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {entry.employees?.prenom} {entry.employees?.nom}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          <div className="text-2xl">
                            {getMoodEmoji(entry.mood_emoji)}
                          </div>
                        </div>
                        {entry.need_type && (
                          <div className="text-sm text-muted-foreground mt-2">
                            Besoin : {entry.need_type}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Admin/Manager: Configuration des congés */}
          {isAdminOrManager && (
            <TabsContent value="leave-config" className="mt-6">
              <LeaveConfigPanel />
            </TabsContent>
          )}

          {/* Employé: Mon humeur (lecture seule) */}
          {!isAdminOrManager && (
            <TabsContent value="my-mood" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mon historique Mood</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {moodEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Aucun enregistrement mood
                    </p>
                  ) : (
                    moodEntries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getMoodEmoji(entry.mood_emoji)}</span>
                            <span className="text-sm">{entry.mood_label}</span>
                          </div>
                        </div>
                        {entry.need_type && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Besoin : {entry.need_type}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

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
