import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Cagnotte {
  total_points: number;
}

interface Reward {
  id: string;
  titre: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
}

interface TopEmployee {
  id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  score: number;
}

interface Props {
  employeeId: string;
}

export const AnnualCagnotteWidget = ({ employeeId }: Props) => {
  const [cagnotte, setCagnotte] = useState<Cagnotte | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [topEmployees, setTopEmployees] = useState<TopEmployee[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [pointsFromFirst, setPointsFromFirst] = useState<number>(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchCagnotte(),
        fetchRewards(),
        fetchRankings()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCagnotte = async () => {
    const { data, error } = await supabase
      .from('annual_cagnotte')
      .select('total_points')
      .eq('employee_id', employeeId)
      .eq('annee', currentYear)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching cagnotte:', error);
      return;
    }

    setCagnotte(data || { total_points: 0 });
  };

  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from('reward_catalog')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      return;
    }

    setRewards(data || []);
  };

  const fetchRankings = async () => {
    const { data, error } = await supabase
      .from('monthly_scores')
      .select(`
        score_global,
        employee:employees(id, nom, prenom, photo_url)
      `)
      .eq('mois', currentMonth)
      .eq('annee', currentYear)
      .order('score_global', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching rankings:', error);
      return;
    }

    const rankings = (data || []).map((item: any, index) => ({
      id: item.employee.id,
      nom: item.employee.nom,
      prenom: item.employee.prenom,
      photo_url: item.employee.photo_url,
      score: item.score_global || 0
    }));

    setTopEmployees(rankings.slice(0, 3));

    const myRank = rankings.findIndex((emp: any) => emp.id === employeeId);
    if (myRank >= 0) {
      setUserRank(myRank + 1);
      if (myRank > 0) {
        setPointsFromFirst(rankings[0].score - rankings[myRank].score);
      }
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!cagnotte || cagnotte.total_points < reward.points_required) {
      toast.error("Vous n'avez pas assez de points");
      return;
    }

    try {
      // Insérer la redemption
      const { error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          employee_id: employeeId,
          reward_id: reward.id,
          points_spent: reward.points_required,
          status: 'pending'
        });

      if (redemptionError) throw redemptionError;

      // Mettre à jour la cagnotte
      const { error: cagnotteError } = await supabase
        .from('annual_cagnotte')
        .update({
          total_points: cagnotte.total_points - reward.points_required
        })
        .eq('employee_id', employeeId)
        .eq('annee', currentYear);

      if (cagnotteError) throw cagnotteError;

      toast.success(`Récompense "${reward.titre}" échangée avec succès !`);
      setSelectedReward(null);
      fetchData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error("Erreur lors de l'échange");
    }
  };

  if (loading) return null;

  const canAfford = (points: number) => cagnotte && cagnotte.total_points >= points;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Cagnotte annuelle {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {cagnotte?.total_points || 0} pts
            </div>
            <p className="text-sm text-muted-foreground">
              Points disponibles pour des récompenses
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Podium du mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topEmployees.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucun classement disponible</p>
          ) : (
            <>
              <div className="flex justify-center items-end gap-4 mb-4">
                {topEmployees.map((emp, index) => (
                  <div key={emp.id} className="flex flex-col items-center">
                    <Avatar className={index === 0 ? "h-16 w-16 ring-2 ring-primary" : "h-12 w-12"}>
                      <AvatarImage src={emp.photo_url || undefined} />
                      <AvatarFallback>{emp.prenom[0]}{emp.nom[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium mt-1">{emp.prenom}</p>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="mt-1 text-xs">
                      {Math.round(emp.score)} pts
                    </Badge>
                  </div>
                ))}
              </div>
              {userRank && userRank > 3 && (
                <p className="text-center text-sm text-muted-foreground">
                  Vous êtes {userRank}ème à {pointsFromFirst} points du 1er
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Récompenses disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <Card key={reward.id} className={!canAfford(reward.points_required) ? "opacity-50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{reward.titre}</CardTitle>
                    <Badge variant={canAfford(reward.points_required) ? "default" : "secondary"}>
                      {reward.points_required} pts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {reward.description || "Aucune description"}
                  </p>
                  <Button
                    onClick={() => setSelectedReward(reward)}
                    disabled={!canAfford(reward.points_required)}
                    className="w-full"
                  >
                    {canAfford(reward.points_required) ? "Échanger" : "Pas assez de points"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'échange</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <p>
                Voulez-vous échanger <strong>{selectedReward.points_required} points</strong> contre:
              </p>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selectedReward.titre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {selectedReward.description}
                  </p>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground">
                Il vous restera <strong>{(cagnotte?.total_points || 0) - selectedReward.points_required} points</strong> après cet échange.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedReward(null)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={() => handleRedeemReward(selectedReward)} className="flex-1">
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
