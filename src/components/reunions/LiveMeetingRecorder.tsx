import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";

interface LiveMeetingRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Project {
  id: string;
  titre: string;
}

interface Task {
  id: string;
  titre: string;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface Timestamp {
  project_id: string;
  task_id?: string;
  timestamp_seconds: number;
  note?: string;
  project_titre?: string;
  task_titre?: string;
}

export const LiveMeetingRecorder = ({ open, onOpenChange, onSuccess }: LiveMeetingRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [currentNote, setCurrentNote] = useState("");
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [titre, setTitre] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      fetchProjects();
      fetchEmployees();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    } else {
      setTasks([]);
      setSelectedTaskId("");
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, titre")
      .order("titre");

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
      return;
    }

    setProjects(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom, prenom");

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive",
      });
      return;
    }

    setEmployees(data || []);
  };

  const fetchTasks = async (projectId: string) => {
    const { data, error } = await supabase
      .from("project_tasks")
      .select(`
        task_id,
        tasks (
          id,
          titre
        )
      `)
      .eq("project_id", projectId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive",
      });
      return;
    }

    const tasksList = data?.map((pt: any) => ({
      id: pt.tasks.id,
      titre: pt.tasks.titre,
    })) || [];

    setTasks(tasksList);
  };

  const startRecording = async () => {
    if (!titre.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez saisir un titre pour la réunion",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Enregistrement démarré",
        description: "L'enregistrement audio est en cours",
      });
    } catch (error) {
      toast({
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast({
        title: "Enregistrement arrêté",
        description: "Sauvegarde en cours...",
      });

      saveRecording();
    }
  };

  const addTimestamp = () => {
    if (!selectedProjectId) {
      toast({
        title: "Projet requis",
        description: "Veuillez sélectionner un projet",
        variant: "destructive",
      });
      return;
    }

    const project = projects.find((p) => p.id === selectedProjectId);
    const task = tasks.find((t) => t.id === selectedTaskId);

    const newTimestamp: Timestamp = {
      project_id: selectedProjectId,
      task_id: selectedTaskId || undefined,
      timestamp_seconds: elapsedSeconds,
      note: currentNote || undefined,
      project_titre: project?.titre,
      task_titre: task?.titre,
    };

    setTimestamps([...timestamps, newTimestamp]);
    setCurrentNote("");
    setSelectedTaskId("");

    toast({
      title: "Marquage ajouté",
      description: `Marqué à ${formatTime(elapsedSeconds)}`,
    });
  };

  const removeTimestamp = (index: number) => {
    setTimestamps(timestamps.filter((_, i) => i !== index));
  };

  const saveRecording = async () => {
    setSaving(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const fileName = `meeting-${Date.now()}.webm`;
      const filePath = `meetings/${fileName}`;

      // Upload audio to storage
      const { error: uploadError } = await supabase.storage
        .from("meetings")
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("meetings")
        .getPublicUrl(filePath);

      // Collect unique project IDs from timestamps
      const projectIds = [...new Set(timestamps.map(t => t.project_id).filter(Boolean))] as string[];

      // Create meeting record
      const { data: meetingData, error: meetingError } = await supabase
        .from("project_meetings")
        .insert({
          titre,
          participants: JSON.stringify(participantIds),
          notes,
          audio_url: urlData.publicUrl,
          date_reunion: new Date().toISOString(),
          project_ids: projectIds.length > 0 ? projectIds : null,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Insert timestamps
      if (timestamps.length > 0) {
        const timestampsToInsert = timestamps.map((ts) => ({
          meeting_id: meetingData.id,
          project_id: ts.project_id,
          task_id: ts.task_id,
          timestamp_seconds: ts.timestamp_seconds,
          note: ts.note,
        }));

        const { error: timestampsError } = await supabase
          .from("meeting_timestamps")
          .insert(timestampsToInsert);

        if (timestampsError) throw timestampsError;
      }

      // Trigger transcription
      await supabase.functions.invoke("transcribe-meeting-audio", {
        body: { meetingId: meetingData.id },
      });

      toast({
        title: "Réunion enregistrée",
        description: "L'enregistrement a été sauvegardé avec succès",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving recording:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setIsRecording(false);
    setElapsedSeconds(0);
    setTimestamps([]);
    setTitre("");
    setParticipantIds([]);
    setNotes("");
    setSelectedProjectId("");
    setSelectedTaskId("");
    setCurrentNote("");
    setSaving(false);
    audioChunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer une réunion en direct</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Meeting info */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="titre">Titre de la réunion *</Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                disabled={isRecording}
                placeholder="Titre de la réunion"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="participants">Participants *</Label>
              <MultiSelectCombobox
                selectedValues={participantIds}
                onSelectedValuesChange={setParticipantIds}
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.prenom} ${emp.nom}`,
                }))}
                placeholder="Sélectionner les participants"
                searchPlaceholder="Rechercher un employé..."
                emptyMessage="Aucun employé trouvé."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isRecording}
                placeholder="Notes de réunion"
                rows={3}
              />
            </div>
          </div>

          {/* Recording controls */}
          <Card className="p-6 bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground">En cours...</span>
                  </div>
                )}
                <div className="text-3xl font-mono font-bold">{formatTime(elapsedSeconds)}</div>
              </div>

              <div className="flex gap-2">
                {!isRecording ? (
                  <Button onClick={startRecording} size="lg" className="gap-2">
                    <Mic className="h-5 w-5" />
                    Démarrer l'enregistrement
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                    <Square className="h-5 w-5" />
                    Arrêter l'enregistrement
                  </Button>
                )}
              </div>
            </div>

            {isRecording && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-4">Marquer un moment</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Projet *</Label>
                      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un projet" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.titre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Tâche (optionnel)</Label>
                      <Select
                        value={selectedTaskId}
                        onValueChange={setSelectedTaskId}
                        disabled={!selectedProjectId || tasks.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une tâche" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.titre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Note (optionnel)</Label>
                    <Input
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="Ajouter une note pour ce moment"
                    />
                  </div>

                  <Button onClick={addTimestamp} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Marquer ce moment ({formatTime(elapsedSeconds)})
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Timestamps list */}
          {timestamps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Marquages effectués ({timestamps.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {timestamps.map((ts, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-primary">
                            {formatTime(ts.timestamp_seconds)}
                          </span>
                          <span className="text-sm font-medium">{ts.project_titre}</span>
                          {ts.task_titre && (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-sm text-muted-foreground">{ts.task_titre}</span>
                            </>
                          )}
                        </div>
                        {ts.note && <p className="text-sm text-muted-foreground">{ts.note}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimestamp(index)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
