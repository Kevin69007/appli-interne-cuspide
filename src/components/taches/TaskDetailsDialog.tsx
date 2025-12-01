import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, User, CheckCircle2, XCircle, RotateCcw, Send, Info, Lock, CalendarPlus, History, MessageSquare, Edit2, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskCommentsHierarchical } from "./TaskCommentsHierarchical";
import { SubTasksList } from "./SubTasksList";
import { RappelsList } from "./RappelsList";
import { BoomerangSendDialog } from "./BoomerangSendDialog";
import { BoomerangHistoryTimeline } from "./BoomerangHistoryTimeline";
import { BoomerangTimer } from "./BoomerangTimer";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  currentEmployeeId: string | null;
  onUpdate: () => void;
}

export const TaskDetailsDialog = ({
  open,
  onOpenChange,
  task,
  currentEmployeeId,
  onUpdate,
}: TaskDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showBoomerangDialog, setShowBoomerangDialog] = useState(false);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [tempDeadline, setTempDeadline] = useState(task.date_echeance);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(task.titre);
  const [tempDescription, setTempDescription] = useState(task.description || "");
  const [employees, setEmployees] = useState<{id: string, nom: string, prenom: string}[]>([]);

  useEffect(() => {
    fetchCurrentEmployeeName();
    fetchEmployees();
  }, [currentEmployeeId]);

  const fetchCurrentEmployeeName = async () => {
    if (!currentEmployeeId) return;
    const { data } = await supabase
      .from("employees")
      .select("nom, prenom")
      .eq("id", currentEmployeeId)
      .single();
    if (data) {
      setCurrentEmployeeName(`${data.prenom} ${data.nom}`);
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");
    if (data) setEmployees(data);
  };

  const handleInlineDeadlineUpdate = async () => {
    if (!tempDeadline) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ date_echeance: tempDeadline })
        .eq("id", task.id);
      if (error) throw error;
      toast.success("Date mise à jour");
      setIsEditingDeadline(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!tempTitle.trim()) {
      toast.error("Le titre ne peut pas être vide");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ titre: tempTitle.trim() })
        .eq("id", task.id);
      if (error) throw error;
      toast.success("Titre mis à jour");
      setIsEditingTitle(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDescription = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ description: tempDescription.trim() || null })
        .eq("id", task.id);
      if (error) throw error;
      toast.success("Description mise à jour");
      setIsEditingDescription(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ priorite: newPriority })
        .eq("id", task.id);
      if (error) throw error;
      toast.success("Priorité mise à jour");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIsPriority = async (checked: boolean) => {
    setLoading(true);
    try {
      const updates: any = { is_priority: checked };
      if (checked) updates.priorite = "haute";
      
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", task.id);
      if (error) throw error;
      toast.success(checked ? "Tâche marquée comme prioritaire" : "Tâche retirée des prioritaires");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignee = async (newAssigneeId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: newAssigneeId })
        .eq("id", task.id);
      if (error) throw error;
      toast.success("Assignation mise à jour");
      onUpdate();
      
      // Notification au nouvel assigné
      await supabase.from("notifications").insert({
        employee_id: newAssigneeId,
        titre: "Tâche assignée",
        message: `Vous êtes maintenant assigné à la tâche : ${task.titre}`,
        type: "task_assigned",
        url: "/taches",
      });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBoomerang = async () => {
    setLoading(true);
    try {
      const historyEntry = {
        from: currentEmployeeId,
        to: task.boomerang_original_owner,
        from_name: currentEmployeeName,
        to_name: task.boomerang_owner ? `${task.boomerang_owner.prenom} ${task.boomerang_owner.nom}` : "",
        sent_at: task.boomerang_history?.[task.boomerang_history.length - 1]?.sent_at || new Date().toISOString(),
        returned_at: new Date().toISOString(),
        auto_return: false,
      };

      const { error } = await supabase
        .from("tasks")
        .update({
          boomerang_active: false,
          boomerang_current_holder: null,
          assigned_to: task.boomerang_original_owner,
          boomerang_history: [...(task.boomerang_history || []), historyEntry],
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notification au propriétaire
      await supabase.from("notifications").insert({
        employee_id: task.boomerang_original_owner,
        titre: "🪃 Boomerang retourné",
        message: `${currentEmployeeName} vous a renvoyé le boomerang : ${task.titre}`,
        type: "boomerang_returned",
        url: "/taches",
      });

      toast.success("Boomerang retourné avec succès");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error returning boomerang:", error);
      toast.error("Erreur lors du retour du boomerang");
    } finally {
      setLoading(false);
    }
  };

  const handleRecallBoomerang = async () => {
    if (!confirm("Êtes-vous sûr de vouloir récupérer ce boomerang immédiatement ?")) return;

    setLoading(true);
    try {
      const historyEntry = {
        from: task.boomerang_current_holder,
        to: currentEmployeeId,
        from_name: task.boomerang_holder ? `${task.boomerang_holder.prenom} ${task.boomerang_holder.nom}` : "",
        to_name: currentEmployeeName,
        sent_at: task.boomerang_history?.[task.boomerang_history.length - 1]?.sent_at || new Date().toISOString(),
        returned_at: new Date().toISOString(),
        recalled: true,
      };

      const { error } = await supabase
        .from("tasks")
        .update({
          boomerang_active: false,
          boomerang_current_holder: null,
          assigned_to: currentEmployeeId,
          boomerang_history: [...(task.boomerang_history || []), historyEntry],
        })
        .eq("id", task.id);

      if (error) throw error;

      // Notification au détenteur
      await supabase.from("notifications").insert({
        employee_id: task.boomerang_current_holder,
        titre: "🪃 Boomerang rappelé",
        message: `${currentEmployeeName} a récupéré son boomerang : ${task.titre}`,
        type: "boomerang_recalled",
        url: "/taches",
      });

      toast.success("Boomerang récupéré");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error recalling boomerang:", error);
      toast.error("Erreur lors de la récupération");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case "haute":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      case "normale":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "basse":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  const isBoomerangHolder = task.boomerang_active && task.boomerang_current_holder === currentEmployeeId;
  const isBoomerangOwner = task.boomerang_active && task.boomerang_original_owner === currentEmployeeId;
  const canSendBoomerang = !task.boomerang_active && (task.assigned_to === currentEmployeeId || task.created_by === currentEmployeeId);
  const isCreator = task.created_by === currentEmployeeId;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isCreator ? (
                  isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className="text-2xl font-semibold"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdateTitle} disabled={loading}>OK</Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setIsEditingTitle(false);
                        setTempTitle(task.titre);
                      }}>Annuler</Button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingTitle(true)} 
                      className="text-2xl font-semibold hover:text-primary underline decoration-dotted cursor-pointer text-left w-full"
                    >
                      {task.titre}
                      <Edit2 className="h-4 w-4 ml-2 inline opacity-50" />
                    </button>
                  )
                ) : (
                  <DialogTitle className="text-2xl">{task.titre}</DialogTitle>
                )}
                
                {isCreator ? (
                  isEditingDescription ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        placeholder="Description..."
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateDescription} disabled={loading}>OK</Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setIsEditingDescription(false);
                          setTempDescription(task.description || "");
                        }}>Annuler</Button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingDescription(true)}
                      className="text-muted-foreground mt-2 hover:text-primary underline decoration-dotted cursor-pointer text-left w-full"
                    >
                      {task.description || "Ajouter une description..."}
                      <Edit2 className="h-3 w-3 ml-2 inline opacity-50" />
                    </button>
                  )
                ) : (
                  task.description && (
                    <p className="text-muted-foreground mt-2">{task.description}</p>
                  )
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {isCreator ? (
                <Select value={task.priorite} onValueChange={handleUpdatePriority} disabled={loading}>
                  <SelectTrigger className="w-auto border-none p-0 h-auto">
                    <Badge className={getPriorityColor(task.priorite)}>{task.priorite}</Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getPriorityColor(task.priorite)}>{task.priorite}</Badge>
              )}
              
              {isCreator && (
                <div className="flex items-center gap-2 ml-2">
                  <Switch 
                    checked={task.is_priority || false} 
                    onCheckedChange={handleToggleIsPriority}
                    disabled={loading}
                  />
                  <Label className="text-sm cursor-pointer" onClick={() => handleToggleIsPriority(!task.is_priority)}>
                    <Star className="h-3 w-3 inline mr-1" />
                    Prioritaire (suivi quotidien)
                  </Label>
                </div>
              )}
              
              {task.statut === "terminee" ? (
                <Badge className="bg-green-500/20 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Terminée
                </Badge>
              ) : task.statut === "annulee" ? (
                <Badge className="bg-red-500/20 text-red-700">
                  <XCircle className="h-3 w-3 mr-1" />
                  Annulée
                </Badge>
              ) : (
                <Badge variant="outline">En cours</Badge>
              )}
              {task.boomerang_active && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
                          🪃 Mode Boomerang
                        </Badge>
                        <Info className="h-3 w-3 text-orange-700 dark:text-orange-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1 text-xs">
                        <p><strong>Mode Boomerang :</strong></p>
                        <p>Cette tâche a été déléguée temporairement à un collègue pour obtenir de l'aide ou des informations.</p>
                        <p className="text-orange-600 dark:text-orange-300 font-medium">
                          ⏱️ Elle reviendra automatiquement à son propriétaire après le délai défini.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {isCreator ? (
                  isEditingDeadline ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={tempDeadline}
                        onChange={(e) => setTempDeadline(e.target.value)}
                        className="h-8 w-auto"
                      />
                      <Button size="sm" onClick={handleInlineDeadlineUpdate} disabled={loading}>
                        OK
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setIsEditingDeadline(false);
                        setTempDeadline(task.date_echeance);
                      }}>
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingDeadline(true)}
                      className="hover:text-primary underline decoration-dotted cursor-pointer"
                    >
                      Échéance : {new Date(task.date_echeance).toLocaleDateString("fr-FR")}
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Échéance : {new Date(task.date_echeance).toLocaleDateString("fr-FR")}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {task.creator_employee ? (
                            <>
                              Seul {task.creator_employee.prenom} {task.creator_employee.nom} peut modifier cette date.
                              Contactez-le pour toute modification.
                            </>
                          ) : (
                            "Seul le créateur de cette tâche peut modifier la date."
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>

              {task.assigned_employee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {isCreator ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Assigné à :</span>
                      <Combobox
                        value={task.assigned_to}
                        onValueChange={handleUpdateAssignee}
                        options={employees.map(emp => ({
                          value: emp.id,
                          label: `${emp.prenom} ${emp.nom}`
                        }))}
                        placeholder="Changer l'assigné"
                        className="w-auto"
                      />
                    </div>
                  ) : (
                    <span>
                      Assigné à : {task.assigned_employee.prenom} {task.assigned_employee.nom}
                    </span>
                  )}
                </div>
              )}

              {task.creator_employee && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Créé par : {task.creator_employee.prenom} {task.creator_employee.nom}
                </div>
              )}

              {task.created_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarPlus className="h-4 w-4" />
                  Créée le {new Date(task.created_at).toLocaleDateString("fr-FR")} 
                  à {new Date(task.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Boomerang Info */}
            {task.boomerang_active && (
              <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">🪃 Boomerang actif</h4>
                  {task.boomerang_deadline && <BoomerangTimer deadline={task.boomerang_deadline} />}
                </div>
                <div className="space-y-2 text-sm">
                  {isBoomerangHolder && (
                    <>
                      <p className="text-muted-foreground">
                        Envoyé par : {task.boomerang_owner?.prenom} {task.boomerang_owner?.nom}
                      </p>
                      <p className="text-destructive font-medium">
                        ⚠️ Vous ne pouvez pas clôturer cette tâche. Vous devez la renvoyer au propriétaire.
                      </p>
                      <Button onClick={handleReturnBoomerang} disabled={loading} className="w-full mt-2">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Renvoyer le boomerang
                      </Button>
                    </>
                  )}
                  {isBoomerangOwner && (
                    <>
                      <p className="text-muted-foreground">
                        Détenu par : {task.boomerang_holder?.prenom} {task.boomerang_holder?.nom}
                      </p>
                      <Button onClick={handleRecallBoomerang} disabled={loading} variant="outline" className="w-full mt-2">
                        Récupérer immédiatement
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Boomerang History */}
            {task.boomerang_history && task.boomerang_history.length > 0 && (
              <div className="border rounded-lg p-4">
                <BoomerangHistoryTimeline history={task.boomerang_history} />
              </div>
            )}

            {/* Send Boomerang Button */}
            {canSendBoomerang && task.statut !== "annulee" && task.statut !== "terminee" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setShowBoomerangDialog(true)} 
                      variant="secondary" 
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      🪃 Envoyer en mode Boomerang
                      <Info className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="space-y-2 text-xs">
                      <p><strong>🪃 Le mode Boomerang, c'est quoi ?</strong></p>
                      <p>
                        Déléguez temporairement cette tâche à un collègue pour obtenir de l'aide, 
                        des informations ou une validation.
                      </p>
                      <p className="text-orange-600 dark:text-orange-300 font-medium">
                        ⏱️ La tâche reviendra automatiquement dans votre liste après le délai que vous définirez.
                      </p>
                      <p className="text-muted-foreground italic">
                        Parfait pour ne pas perdre le fil d'une tâche tout en sollicitant un collègue !
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Tabs defaultValue="subtasks" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="subtasks">Sous-tâches</TabsTrigger>
                <TabsTrigger value="comments">
                  Commentaires ({task.commentaires?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reminders">Rappels</TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-1" />
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subtasks">
                <SubTasksList
                  parentTaskId={task.id}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="comments">
                <TaskCommentsHierarchical
                  parentTask={task}
                  currentEmployeeId={currentEmployeeId}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="reminders">
                <RappelsList
                  taskId={task.id}
                  rappels={task.rappels || []}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {/* Création */}
                    {task.created_at && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CalendarPlus className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Tâche créée</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(task.created_at).toLocaleDateString("fr-FR", { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })} à {new Date(task.created_at).toLocaleTimeString("fr-FR", { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {task.creator_employee && (
                            <p className="text-sm text-muted-foreground">
                              par {task.creator_employee.prenom} {task.creator_employee.nom}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dernière modification */}
                    {task.updated_at && task.updated_at !== task.created_at && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <RotateCcw className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Dernière modification</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(task.updated_at).toLocaleDateString("fr-FR", { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })} à {new Date(task.updated_at).toLocaleTimeString("fr-FR", { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Dernier commentaire d'avancement */}
                    {task.last_progress_comment_at && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <MessageSquare className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Dernier commentaire d'avancement</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(task.last_progress_comment_at).toLocaleDateString("fr-FR", { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })} à {new Date(task.last_progress_comment_at).toLocaleTimeString("fr-FR", { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Historique boomerang intégré */}
                    {task.boomerang_history && task.boomerang_history.length > 0 && (
                      <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                        <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                          🪃 Historique Boomerang
                        </h4>
                        <BoomerangHistoryTimeline history={task.boomerang_history} />
                      </div>
                    )}

                    {!task.created_at && !task.updated_at && !task.last_progress_comment_at && (!task.boomerang_history || task.boomerang_history.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Aucun historique disponible pour cette tâche.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <BoomerangSendDialog
        open={showBoomerangDialog}
        onOpenChange={setShowBoomerangDialog}
        taskId={task.id}
        taskTitle={task.titre}
        currentEmployeeId={currentEmployeeId || ""}
        onBoomerangSent={() => {
          onUpdate();
          onOpenChange(false);
        }}
      />
    </>
  );
};
