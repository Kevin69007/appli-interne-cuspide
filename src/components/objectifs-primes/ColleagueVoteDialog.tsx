import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  poste: string | null;
}

interface Vote {
  voted_for_employee_id: string;
  commentaire: string | null;
}

interface Props {
  employeeId: string;
}

export const ColleagueVoteDialog = ({ employeeId }: Props) => {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [currentVote, setCurrentVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (open) {
      fetchEmployees();
      checkIfVoted();
    }
  }, [open, employeeId]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, nom, prenom, photo_url, poste')
      .neq('id', employeeId)
      .order('nom', { ascending: true });

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  const checkIfVoted = async () => {
    const { data, error } = await supabase
      .from('colleague_votes')
      .select('voted_for_employee_id, commentaire')
      .eq('voter_employee_id', employeeId)
      .eq('mois', currentMonth)
      .eq('annee', currentYear)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking vote:', error);
      return;
    }

    if (data) {
      setHasVoted(true);
      setCurrentVote(data);
    } else {
      setHasVoted(false);
      setCurrentVote(null);
    }
  };

  const handleVote = async () => {
    if (!selectedEmployeeId) {
      toast.error("Veuillez sélectionner un collègue");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('colleague_votes')
        .insert({
          voter_employee_id: employeeId,
          voted_for_employee_id: selectedEmployeeId,
          mois: currentMonth,
          annee: currentYear,
          commentaire: commentaire || null
        });

      if (error) throw error;

      toast.success("Votre vote a été enregistré !");
      setOpen(false);
      setSelectedEmployeeId(null);
      setCommentaire("");
      checkIfVoted();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error("Erreur lors du vote");
    } finally {
      setLoading(false);
    }
  };

  const getVotedEmployee = () => {
    if (!currentVote) return null;
    return employees.find(emp => emp.id === currentVote.voted_for_employee_id);
  };

  if (hasVoted) {
    const votedEmployee = getVotedEmployee();
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="font-medium text-sm">✓ Vous avez voté</p>
            {votedEmployee && (
              <p className="text-xs text-muted-foreground">
                Votre vote pour {votedEmployee.prenom} {votedEmployee.nom} a été enregistré
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Voter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🗳️ Vote pour le collègue du mois</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Qui a été le plus remarquable ce mois ?
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployeeId(emp.id)}
                className={cn(
                  "p-4 border rounded-lg hover:border-primary transition-colors",
                  selectedEmployeeId === emp.id && "border-primary bg-primary/5 ring-2 ring-primary"
                )}
              >
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={emp.photo_url || undefined} />
                  <AvatarFallback>{emp.prenom[0]}{emp.nom[0]}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm text-center">
                  {emp.prenom} {emp.nom}
                </p>
                {emp.poste && (
                  <p className="text-xs text-muted-foreground text-center">
                    {emp.poste}
                  </p>
                )}
                {selectedEmployeeId === emp.id && (
                  <div className="mt-2 flex justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedEmployeeId && (
            <div>
              <Label>Pourquoi ? (optionnel)</Label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Partagez pourquoi cette personne mérite d'être collègue du mois..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleVote}
              disabled={loading || !selectedEmployeeId} 
              className="flex-1"
            >
              {loading ? "Envoi..." : "Voter ✓"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};