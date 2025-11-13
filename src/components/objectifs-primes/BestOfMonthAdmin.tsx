import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Trophy, Medal } from "lucide-react";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  score: number;
}

export const BestOfMonthAdmin = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(20);
  const [existingWinner, setExistingWinner] = useState<any>(null);

  useEffect(() => {
    fetchEmployeeScores();
    checkExistingWinner();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBonusConfig();
  }, []);

  const fetchBonusConfig = async () => {
    const { data } = await supabase
      .from('configuration')
      .select('valeur')
      .eq('cle', 'meilleur_mois_bonus')
      .single();

      if (data) {
      const valeurStr = typeof data.valeur === 'string' ? data.valeur : String(data.valeur);
      setBonusPoints(parseInt(valeurStr) || 20);
    }
  };

  const checkExistingWinner = async () => {
    const { data } = await supabase
      .from('best_of_month')
      .select(`
        *,
        employee:employees(nom, prenom, photo_url)
      `)
      .eq('mois', selectedMonth)
      .eq('annee', selectedYear)
      .single();

    setExistingWinner(data);
  };

  const fetchEmployeeScores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_scores')
        .select(`
          score_global,
          employee:employees(id, nom, prenom, photo_url)
        `)
        .eq('mois', selectedMonth)
        .eq('annee', selectedYear)
        .order('score_global', { ascending: false });

      if (error) throw error;

      const employeesWithScores = (data || []).map((item: any) => ({
        id: item.employee.id,
        nom: item.employee.nom,
        prenom: item.employee.prenom,
        photo_url: item.employee.photo_url,
        score: item.score_global || 0
      }));

      setEmployees(employeesWithScores);
    } catch (error) {
      console.error('Error fetching scores:', error);
      toast.error("Erreur lors du chargement des scores");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateBest = async (employeeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Insérer dans best_of_month
      const { error: bomError } = await supabase
        .from('best_of_month')
        .insert({
          employee_id: employeeId,
          mois: selectedMonth,
          annee: selectedYear,
          bonus_points: bonusPoints,
          validated_by: adminEmployee?.id
        });

      if (bomError) throw bomError;

      // Insérer dans agenda_entries
      const { error: agendaError } = await supabase
        .from('agenda_entries')
        .insert({
          employee_id: employeeId,
          date: new Date().toISOString().split('T')[0],
          categorie: 'indicateurs' as any,
          detail: `Meilleur employé du mois ${selectedMonth}/${selectedYear}`,
          points: bonusPoints,
          auteur_id: null,
          statut_validation: 'valide' as const
        } as any);

      if (agendaError) throw agendaError;

      // Créer notification
      const employee = employees.find(e => e.id === employeeId);
      await supabase.from('notifications').insert({
        employee_id: employeeId,
        titre: '🏆 Meilleur du mois !',
        message: `Félicitations ! Vous êtes le meilleur employé du mois de ${selectedMonth}/${selectedYear}. Vous avez gagné ${bonusPoints} points bonus !`,
        type: 'reward',
        url: '/objectifs-primes/employe'
      });

      toast.success(`${employee?.prenom} ${employee?.nom} a été désigné meilleur du mois !`);
      setDialogOpen(false);
      checkExistingWinner();
      fetchEmployeeScores();
    } catch (error) {
      console.error('Error validating best:', error);
      toast.error("Erreur lors de la validation");
    }
  };

  const topThree = employees.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {new Date(2025, i).toLocaleString('fr-FR', { month: 'long' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!existingWinner && (
          <Button onClick={() => setDialogOpen(true)} disabled={loading || employees.length === 0}>
            <Trophy className="mr-2 h-4 w-4" />
            Valider le meilleur du mois
          </Button>
        )}
      </div>

      {existingWinner && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Meilleur du mois validé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={existingWinner.employee.photo_url} />
                <AvatarFallback>
                  {existingWinner.employee.prenom[0]}{existingWinner.employee.nom[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">
                  {existingWinner.employee.prenom} {existingWinner.employee.nom}
                </p>
                <p className="text-sm text-muted-foreground">
                  +{existingWinner.bonus_points} points bonus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Podium du mois</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : topThree.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">Aucun score disponible pour ce mois</p>
          ) : (
            <div className="flex justify-center items-end gap-4 py-8">
              {/* 2nd place */}
              {topThree[1] && (
                <div className="flex flex-col items-center">
                  <Medal className="h-6 w-6 text-muted-foreground mb-2" />
                  <Avatar className="h-20 w-20 mb-2">
                    <AvatarImage src={topThree[1].photo_url || undefined} />
                    <AvatarFallback>{topThree[1].prenom[0]}{topThree[1].nom[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{topThree[1].prenom} {topThree[1].nom}</p>
                  <Badge variant="secondary" className="mt-1">{topThree[1].score} pts</Badge>
                </div>
              )}

              {/* 1st place */}
              {topThree[0] && (
                <div className="flex flex-col items-center">
                  <Trophy className="h-8 w-8 text-primary mb-2" />
                  <Avatar className="h-24 w-24 mb-2 ring-4 ring-primary">
                    <AvatarImage src={topThree[0].photo_url || undefined} />
                    <AvatarFallback>{topThree[0].prenom[0]}{topThree[0].nom[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{topThree[0].prenom} {topThree[0].nom}</p>
                  <Badge className="mt-1">{topThree[0].score} pts</Badge>
                </div>
              )}

              {/* 3rd place */}
              {topThree[2] && (
                <div className="flex flex-col items-center">
                  <Medal className="h-5 w-5 text-muted-foreground mb-2" />
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage src={topThree[2].photo_url || undefined} />
                    <AvatarFallback>{topThree[2].prenom[0]}{topThree[2].nom[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs">{topThree[2].prenom} {topThree[2].nom}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">{topThree[2].score} pts</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le meilleur du mois</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez l'employé à récompenser. Il recevra {bonusPoints} points bonus.
            </p>
            <div className="space-y-2">
              {employees.slice(0, 5).map((employee, index) => (
                <Button
                  key={employee.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleValidateBest(employee.id)}
                >
                  <span className="mr-3 font-bold">{index + 1}</span>
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={employee.photo_url || undefined} />
                    <AvatarFallback>{employee.prenom[0]}{employee.nom[0]}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left">{employee.prenom} {employee.nom}</span>
                  <Badge>{employee.score} pts</Badge>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
