import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyScore {
  score_indicateurs: number;
  bonus_points: number;
  malus_points: number;
  score_global: number;
  projection_status: string | null;
  projection_percentage: number;
}

interface Props {
  employeeId: string;
  month: number;
  year: number;
}

export const EmployeeMonthlyScore = ({ employeeId, month, year }: Props) => {
  const [score, setScore] = useState<MonthlyScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, [employeeId, month, year]);

  const fetchScore = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_scores')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('mois', month)
        .eq('annee', year)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setScore((data as any) || {
        score_indicateurs: 0,
        bonus_points: 0,
        malus_points: 0,
        score_global: 0,
        projection_status: null,
        projection_percentage: 0
      });
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !score) {
    return null;
  }

  const getProgressColor = () => {
    if (score.score_global >= 80) return "bg-green-500";
    if (score.score_global >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProjectionIcon = () => {
    switch (score.projection_status) {
      case 'en_avance':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'en_retard':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-orange-600" />;
    }
  };

  const getProjectionLabel = () => {
    switch (score.projection_status) {
      case 'en_avance':
        return 'En avance';
      case 'en_retard':
        return 'En retard';
      default:
        return 'Dans les temps';
    }
  };

  const getProjectionMessage = () => {
    const totalDays = new Date(year, month, 0).getDate();
    const currentDay = new Date().getDate();
    const monthPercentage = Math.round((currentDay / totalDays) * 100);
    
    return `Vous êtes à ${monthPercentage}% du mois avec ${Math.round(score.projection_percentage)}% des objectifs atteints.`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score du mois</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Score global</span>
            <span className="text-2xl font-bold">{Math.round(score.score_global)} / 100</span>
          </div>
          <Progress value={score.score_global} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Indicateurs</div>
            <div className="text-xl font-semibold">{Math.round(score.score_indicateurs)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Bonus</div>
            <div className="text-xl font-semibold text-green-600">+{Math.round(score.bonus_points)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Malus</div>
            <div className="text-xl font-semibold text-red-600">{Math.round(score.malus_points)}</div>
          </div>
        </div>

        {score.projection_status && (
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {getProjectionIcon()}
              <span className="font-semibold">{getProjectionLabel()}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {getProjectionMessage()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
