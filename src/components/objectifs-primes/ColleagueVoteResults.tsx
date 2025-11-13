import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users } from "lucide-react";
import { toast } from "sonner";

interface VoteResult {
  employee_id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  vote_count: number;
  commentaires: string[];
}

export const ColleagueVoteResults = () => {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchResults();
  }, [selectedMonth, selectedYear]);

  const fetchResults = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('colleague_votes')
      .select(`
        voted_for_employee_id,
        commentaire,
        employee:employees!colleague_votes_voted_for_employee_id_fkey(nom, prenom, photo_url)
      `)
      .eq('mois', selectedMonth)
      .eq('annee', selectedYear);

    if (error) {
      console.error('Error fetching vote results:', error);
      setLoading(false);
      return;
    }

    // Grouper les votes par employé
    const grouped = (data || []).reduce((acc: any, vote: any) => {
      const empId = vote.voted_for_employee_id;
      if (!acc[empId]) {
        acc[empId] = {
          employee_id: empId,
          nom: vote.employee.nom,
          prenom: vote.employee.prenom,
          photo_url: vote.employee.photo_url,
          vote_count: 0,
          commentaires: []
        };
      }
      acc[empId].vote_count++;
      if (vote.commentaire) {
        acc[empId].commentaires.push(vote.commentaire);
      }
      return acc;
    }, {});

    const resultsArray = Object.values(grouped) as VoteResult[];
    resultsArray.sort((a, b) => b.vote_count - a.vote_count);
    
    setResults(resultsArray);
    setLoading(false);
  };

  const handleDesignateWinner = async (employeeId: string) => {
    try {
      // Récupérer les points bonus configurés
      const { data: configData } = await supabase
        .from('configuration')
        .select('valeur')
        .eq('cle', 'colleague_vote_bonus')
        .single();

      const bonusPoints = (configData?.valeur as any)?.points || 20;

      // Créer l'entrée dans best_of_month
      const { error: bomError } = await supabase
        .from('best_of_month')
        .insert({
          employee_id: employeeId,
          mois: selectedMonth,
          annee: selectedYear,
          bonus_points: bonusPoints
        });

      if (bomError) throw bomError;

      // Ajouter les points dans agenda_entries
      const { error: agendaError } = await supabase
        .from('agenda_entries')
        .insert({
          employee_id: employeeId,
          date: new Date(`${selectedYear}-${selectedMonth}-01`).toISOString().split('T')[0],
          categorie: 'indicateurs' as const,
          points: bonusPoints,
          detail: `Collègue du mois - Vote`,
          statut_validation: 'valide' as const
        });

      if (agendaError) throw agendaError;

      toast.success("Le collègue du mois a été désigné et les points ont été attribués !");
      fetchResults();
    } catch (error) {
      console.error('Error designating winner:', error);
      toast.error("Erreur lors de la désignation");
    }
  };

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Résultats des votes - Collègue du mois</h3>
          
          <div className="flex gap-4 mb-6">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucun vote pour cette période</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={result.employee_id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {index === 0 && (
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    )}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={result.photo_url || undefined} />
                      <AvatarFallback>{result.prenom[0]}{result.nom[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {result.prenom} {result.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.vote_count} vote{result.vote_count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    {index === 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleDesignateWinner(result.employee_id)}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Désigner gagnant
                      </Button>
                    )}
                  </div>
                </div>
                
                {result.commentaires.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Commentaires :</p>
                    <div className="space-y-2">
                      {result.commentaires.map((comment, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground italic pl-4 border-l-2">
                          "{comment}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};