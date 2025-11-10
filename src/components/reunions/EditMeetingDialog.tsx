import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  titre: string;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface EditMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  onSuccess: () => void;
}

export const EditMeetingDialog = ({ open, onOpenChange, meetingId, onSuccess }: EditMeetingDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [titre, setTitre] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dateReunion, setDateReunion] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, meetingId]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Fetch meeting details
      const { data: meeting, error: meetingError } = await supabase
        .from("project_meetings")
        .select("*")
        .eq("id", meetingId)
        .single();

      if (meetingError) throw meetingError;

      setTitre(meeting.titre);
      
      // Parse project_ids
      let projectIds: string[] = [];
      if (meeting.project_ids) {
        if (Array.isArray(meeting.project_ids)) {
          projectIds = meeting.project_ids.map(p => String(p));
        }
      } else if (meeting.project_id) {
        projectIds = [String(meeting.project_id)];
      }
      setSelectedProjects(projectIds);
      
      setDateReunion(meeting.date_reunion?.split('T')[0] || "");
      setNotes(meeting.notes || "");
      
      // Parse participants - handle both array and jsonb
      let participantIds: string[] = [];
      if (meeting.participants) {
        if (Array.isArray(meeting.participants)) {
          participantIds = meeting.participants.map(p => String(p));
        } else if (typeof meeting.participants === 'string') {
          try {
            const parsed = JSON.parse(meeting.participants);
            participantIds = Array.isArray(parsed) ? parsed.map(p => String(p)) : [];
          } catch {
            participantIds = [];
          }
        }
      }
      setSelectedParticipants(participantIds);

      // Fetch projects and employees
      const [projectsRes, employeesRes] = await Promise.all([
        supabase.from("projects").select("id, titre").order("titre"),
        supabase.from("employees").select("id, nom, prenom").order("nom")
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setProjects(projectsRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titre.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est obligatoire",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("project_meetings")
        .update({
          titre: titre.trim(),
          project_ids: selectedProjects.length > 0 ? selectedProjects : null,
          date_reunion: dateReunion || null,
          notes: notes.trim() || null,
          participants: selectedParticipants,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meetingId);

      if (error) throw error;

      toast({
        title: "Réunion modifiée",
        description: "Les modifications ont été enregistrées",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating meeting:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la réunion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const participantOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.prenom} ${emp.nom}`
  }));

  const projectOptions = projects.map(project => ({
    value: project.id,
    label: project.titre
  }));

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la réunion</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre de la réunion"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projects">Projets liés</Label>
            <MultiSelect
              options={projectOptions}
              selectedValues={selectedProjects}
              onSelectedValuesChange={setSelectedProjects}
              placeholder="Sélectionner les projets"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date de la réunion</Label>
            <Input
              id="date"
              type="date"
              value={dateReunion}
              onChange={(e) => setDateReunion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Participants</Label>
            <MultiSelect
              options={participantOptions}
              selectedValues={selectedParticipants}
              onSelectedValuesChange={setSelectedParticipants}
              placeholder="Sélectionner les participants"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes additionnelles..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
