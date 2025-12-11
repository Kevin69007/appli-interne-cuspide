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
import { ModuleHelpButton } from "@/components/communication/ModuleHelpButton";

interface LeaveRequest {
  id: string;
  employee_id: string;
  date: string;
  type_absence: string;
  detail: string;
  statut_validation: string;
  request_group_id: string | null;
  employees: { nom: string; prenom: string; equipe: string };
}

interface GroupedLeaveRequest extends LeaveRequest {
  dateRange: { start: string; end: string };
  daysCount: number;
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
  request_group_id: string | null;
  employees: { nom: string; prenom: string; equipe: string };
  validator?: { email: string } | null;
}

interface GroupedAbsence extends Absence {
  dateRange: { start: string; end: string };
  daysCount: number;
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

// Function to group leave requests/absences by period
const groupByPeriod = <T extends { id: string; employee_id: string; date: string; detail: string; request_group_id: string | null }>(
  items: T[]
): (T & { dateRange: { start: string; end: string }; daysCount: number })[] => {
  const grouped = new Map<string, T[]>();
  
  items.forEach(item => {
    // Group key: use request_group_id if available, otherwise fall back to employee_id + detail
    const key = item.request_group_id || `${item.employee_id}_${item.detail}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });
  
  // Return one item per group with aggregated date range
  return Array.from(grouped.values()).map(group => {
    const sorted = group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      ...sorted[0],
      dateRange: {
        start: sorted[0].date,
        end: sorted[sorted.length - 1].date
      },
      daysCount: group.length
    };
  });
};

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
        .select("id, employee_id, date, type_absence, detail, statut_validation, request_group_id, employees(nom, prenom, equipe)")
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
          valide_par, date_validation, request_group_id,
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

  const handleLeaveValidation = async (leaveId: string, approved: boolean, fromAbsencesTab = false) => {
    try {
      // Get the original leave request to extract dates and detail
      const { data: originalRequest, error: fetchError } = await supabase
        .from("agenda_entries")
        .select("*, employees(user_id)")
        .eq("id", leaveId)
        .single();

      if (fetchError || !originalRequest) {
        toast.error("Erreur lors de la récupération de la demande");
        return;
      }

      // Build query based on whether we have a request_group_id or need to fall back to detail
      let updateQuery = supabase
        .from("agenda_entries")
        .update({ 
          statut_validation: approved ? "valide" : "refuse",
          valide_par: user?.id,
          date_validation: new Date().toISOString()
        })
        .eq("employee_id", originalRequest.employee_id);

      // Use request_group_id if available, otherwise fall back to detail
      if (originalRequest.request_group_id) {
        updateQuery = updateQuery.eq("request_group_id", originalRequest.request_group_id);
      } else {
        updateQuery = updateQuery.eq("detail", originalRequest.detail);
      }

      // Only filter by en_attente if not from absences tab (allows revoking/reapproving)
      if (!fromAbsencesTab) {
        updateQuery = updateQuery.eq("statut_validation", "en_attente");
      }

      const { error: updateError } = await updateQuery;

      if (updateError) {
        toast.error("Erreur lors de la validation");
        return;
      }

      // Send notification if refused
      if (!approved && originalRequest.employee_id) {
        await supabase.from("notifications").insert({
          employee_id: originalRequest.employee_id,
          titre: "Demande de congés refusée",
          message: `Votre demande de congés "${originalRequest.detail}" a été refusée.`,
          type: "leave_rejected",
          statut: "actif"
        });
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
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold truncate">Ressources Humaines</h1>
          <ModuleHelpButton moduleId="rh" />
        </div>

        <Tabs defaultValue={isAdminOrManager ? "leave-requests" : "my-requests"} className="w-full">
          <TabsList scrollable className="mb-4">
            {isAdminOrManager ? (
              <>
                <TabsTrigger value="leave-requests" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Demandes</span>
                  <span className="sm:hidden">Dem.</span>
                  {" "}({groupByPeriod(leaveRequests).length})
                </TabsTrigger>
                <TabsTrigger value="absences" className="text-xs sm:text-sm">Absences</TabsTrigger>
                <TabsTrigger value="mood" className="text-xs sm:text-sm">
                  Mood {lowMoodAlerts.length > 0 && `(${lowMoodAlerts.length})`}
                </TabsTrigger>
                <TabsTrigger value="leave-config" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Config. congés</span>
                  <span className="sm:hidden">Config.</span>
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="my-requests" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Mes demandes</span>
                  <span className="sm:hidden">Demandes</span>
                  {" "}({groupByPeriod(leaveRequests).length})
                </TabsTrigger>
                <TabsTrigger value="my-absences" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Mes absences</span>
                  <span className="sm:hidden">Absences</span>
                </TabsTrigger>
                <TabsTrigger value="my-mood" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Mon humeur</span>
                  <span className="sm:hidden">Humeur</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="trombinoscope" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Trombinoscope</span>
              <span className="sm:hidden">Équipe</span>
            </TabsTrigger>
            <TabsTrigger value="payslips" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Fiches de paie</span>
              <span className="sm:hidden">Paie</span>
            </TabsTrigger>
          </TabsList>

          {/* Admin/Manager: Demandes de congés avec actions */}
          {isAdminOrManager && (
            <TabsContent value="leave-requests" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
              {groupByPeriod(leaveRequests).length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                  Aucune demande en attente
                </p>
              ) : (
                groupByPeriod(leaveRequests).map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2 sm:pb-4 p-3 sm:p-6">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm sm:text-base">
                        <span>
                          {request.employees.prenom} {request.employees.nom}
                        </span>
                        <Badge className="w-fit">{request.employees.equipe}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                      <div className="grid gap-1 sm:gap-2 text-xs sm:text-sm">
                        <div>
                          <strong>Période :</strong>{" "}
                          {request.dateRange.start === request.dateRange.end
                            ? new Date(request.dateRange.start).toLocaleDateString("fr-FR")
                            : `${new Date(request.dateRange.start).toLocaleDateString("fr-FR")} - ${new Date(request.dateRange.end).toLocaleDateString("fr-FR")}`}
                          {request.daysCount > 1 && ` (${request.daysCount} jours)`}
                        </div>
                        {request.detail && (
                          <div className="line-clamp-2">
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
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleLeaveValidation(request.id, true)}
                          className="flex-1 h-9 text-sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleLeaveValidation(request.id, false)}
                          className="flex-1 h-9 text-sm"
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
            <TabsContent value="my-requests" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
              {/* Widget solde de congés pour l'employé */}
              <LeaveBalanceCard 
                employeeId={employee.id} 
                compact 
                showPendingLink 
              />
              
              <div className="flex justify-end mb-3 sm:mb-4">
                <CreateLeaveRequestDialog employeeId={employee.id} onSuccess={fetchData} />
              </div>
              {groupByPeriod(leaveRequests).length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                  Aucune demande de congés. Créez votre première demande !
                </p>
              ) : (
                groupByPeriod(leaveRequests).map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base">
                            {request.dateRange.start === request.dateRange.end
                              ? new Date(request.dateRange.start).toLocaleDateString("fr-FR")
                              : `${new Date(request.dateRange.start).toLocaleDateString("fr-FR")} - ${new Date(request.dateRange.end).toLocaleDateString("fr-FR")}`}
                            {request.daysCount > 1 && ` (${request.daysCount} jours)`}
                          </div>
                          {request.detail && (
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">{request.detail}</div>
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
                          className="w-fit text-xs"
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
            <TabsContent value="absences" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
              <div className="grid gap-2">
                {groupByPeriod(allAbsences).map((absence) => (
                  <Card key={absence.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base">
                            {absence.employees?.prenom} {absence.employees?.nom}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {absence.dateRange.start === absence.dateRange.end
                              ? new Date(absence.dateRange.start).toLocaleDateString("fr-FR")
                              : `${new Date(absence.dateRange.start).toLocaleDateString("fr-FR")} - ${new Date(absence.dateRange.end).toLocaleDateString("fr-FR")}`}
                            {absence.daysCount > 1 && ` (${absence.daysCount}j)`}
                            {" - "}
                            {getAbsenceTypeLabel(absence.type_absence)}
                          </div>
                          {absence.detail && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{absence.detail}</div>
                          )}
                          {absence.statut_validation === "valide" && absence.date_validation && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                              Validé par {absence.validator?.email || "N/A"} le{" "}
                              {new Date(absence.date_validation).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Badge
                            variant={
                              absence.statut_validation === "valide"
                                ? "default"
                                : absence.statut_validation === "refuse"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {absence.statut_validation}
                          </Badge>
                          {absence.statut_validation === "valide" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleLeaveValidation(absence.id, false, true)}
                            >
                              <X className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Révoquer</span>
                            </Button>
                          )}
                          {absence.statut_validation === "refuse" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleLeaveValidation(absence.id, true, true)}
                            >
                              <Check className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Approuver</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Employé: Mes absences (lecture seule) */}
          {!isAdminOrManager && (
            <TabsContent value="my-absences" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
              {allAbsences.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                  Aucune absence enregistrée
                </p>
              ) : (
                <div className="grid gap-2">
                  {groupByPeriod(allAbsences).map((absence) => (
                    <Card key={absence.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base">
                              {absence.dateRange.start === absence.dateRange.end
                                ? new Date(absence.dateRange.start).toLocaleDateString("fr-FR")
                                : `${new Date(absence.dateRange.start).toLocaleDateString("fr-FR")} - ${new Date(absence.dateRange.end).toLocaleDateString("fr-FR")}`}
                              {absence.daysCount > 1 && ` (${absence.daysCount}j)`}
                              {" - "}
                              {getAbsenceTypeLabel(absence.type_absence)}
                            </div>
                            {absence.detail && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{absence.detail}</div>
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
                            className="w-fit text-xs"
                          >
                            {absence.statut_validation === "valide" ? "Validée" : 
                             absence.statut_validation === "refuse" ? "Refusée" : "En attente"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Admin/Manager: Mood Bar avec alertes */}
          {isAdminOrManager && (
            <TabsContent value="mood" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
              {lowMoodAlerts.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-destructive text-sm sm:text-base">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      Alertes Mood Bas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                    {lowMoodAlerts.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="border-l-4 border-destructive pl-2 sm:pl-3 py-1.5 sm:py-2">
                        <div className="font-medium text-xs sm:text-sm">
                          {entry.employees?.prenom} {entry.employees?.nom}
                        </div>
                        <div className="text-[10px] sm:text-sm text-muted-foreground">
                          {getMoodEmoji(entry.mood_emoji)} {entry.mood_label} -{" "}
                          {new Date(entry.date).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base">Historique Mood</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                  {moodEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Aucun enregistrement mood
                    </p>
                  ) : (
                    moodEntries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-2 sm:p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-xs sm:text-sm truncate">
                              {entry.employees?.prenom} {entry.employees?.nom}
                            </div>
                            <div className="text-[10px] sm:text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          <div className="text-xl sm:text-2xl shrink-0">
                            {getMoodEmoji(entry.mood_emoji)}
                          </div>
                        </div>
                        {entry.need_type && (
                          <div className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2">
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
            <TabsContent value="leave-config" className="mt-4 sm:mt-6">
              <LeaveConfigPanel />
            </TabsContent>
          )}

          {/* Employé: Mon humeur (lecture seule) */}
          {!isAdminOrManager && (
            <TabsContent value="my-mood" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
              <Card>
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base">Mon historique Mood</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                  {moodEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Aucun enregistrement mood
                    </p>
                  ) : (
                    moodEntries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-2 sm:p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">{getMoodEmoji(entry.mood_emoji)}</span>
                            <span className="text-xs sm:text-sm">{entry.mood_label}</span>
                          </div>
                        </div>
                        {entry.need_type && (
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
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

          <TabsContent value="trombinoscope" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <Trombinoscope />
          </TabsContent>

          <TabsContent value="payslips" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">Accès aux fiches de paie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
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
