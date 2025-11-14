import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, AlertCircle, ChevronLeft, Star } from "lucide-react";
import { MonthCalendar } from "@/components/objectifs-primes/MonthCalendar";
import { EmployeeMonthlyScore } from "@/components/objectifs-primes/EmployeeMonthlyScore";
import { AnnualCagnotteWidget } from "@/components/objectifs-primes/AnnualCagnotteWidget";
import { EmployeeObjectivesWidget } from "@/components/objectifs-primes/EmployeeObjectivesWidget";
import { ColleagueVoteDialog } from "@/components/objectifs-primes/ColleagueVoteDialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Employe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('indicators');
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [savedMoodRating, setSavedMoodRating] = useState<number | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [hasRespondedToQuiz, setHasRespondedToQuiz] = useState(false);
  const [monthStatus, setMonthStatus] = useState<'ouvert' | 'cloture' | 'publie'>('ouvert');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user) {
      fetchEmployeeId();
    }
  }, [user]);

  useEffect(() => {
    if (employeeId) {
      fetchMoodRating();
      fetchQuiz();
      fetchMonthStatus();
    }
  }, [employeeId]);

  const fetchEmployeeId = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setEmployeeId(data.id);
    }
  };

  const fetchMoodRating = async () => {
    const { data } = await supabase
      .from('mood_ratings')
      .select('rating')
      .eq('employee_id', employeeId)
      .eq('mois', currentMonth)
      .eq('annee', currentYear)
      .maybeSingle();
    
    if (data) {
      setSavedMoodRating(data.rating);
      setMoodRating(data.rating);
    }
  };

  const fetchQuiz = async () => {
    const { data: quizData } = await supabase
      .from('quiz_monthly')
      .select('*')
      .eq('mois', currentMonth)
      .eq('annee', currentYear)
      .eq('is_active', true)
      .maybeSingle();
    
    if (quizData) {
      setQuiz(quizData);
      
      const { data: responseData } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('quiz_id', quizData.id)
        .maybeSingle();
      
      setHasRespondedToQuiz(!!responseData);
    }
  };

  const fetchMonthStatus = async () => {
    const { data } = await supabase
      .from('monthly_scores')
      .select('statut')
      .eq('employee_id', employeeId)
      .eq('mois', currentMonth)
      .eq('annee', currentYear)
      .maybeSingle();

    setMonthStatus(data?.statut || 'ouvert');
  };

  const handleMoodRating = async (rating: number) => {
    setMoodRating(rating);
    
    const { error } = await supabase
      .from('mood_ratings')
      .upsert({
        employee_id: employeeId,
        mois: currentMonth,
        annee: currentYear,
        rating
      });
    
      if (!error) {
        setSavedMoodRating(rating);
        toast.success(t('employee.thankYou'));
      } else {
        toast.error(t('common:error'));
      }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!employeeId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t('employee.myObjectives')}</h1>
                <p className="text-sm text-muted-foreground">{t('title')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Score global */}
        <div className="mb-8">
          <EmployeeMonthlyScore 
            employeeId={employeeId} 
            month={currentMonth} 
            year={currentYear} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Objectifs du mois */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Objectifs du mois</h3>
            </div>
            <EmployeeObjectivesWidget employeeId={employeeId} />
          </div>

          {/* Quiz, Vote, Mood */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Engagement</h3>
            </div>

            {/* Quiz du mois */}
            <Card className="p-4">
              <p className="font-medium mb-2">Quiz du mois</p>
              {!quiz ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Pas de quiz en cours</p>
                </div>
              ) : hasRespondedToQuiz ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-700">✓ Quiz complété</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {quiz.titre}
                  </p>
                  <Button className="w-full" size="sm">
                    Répondre au quiz
                  </Button>
                </div>
              )}
            </Card>

            {/* Vote collègue du mois */}
            <Card className="p-4">
              <p className="font-medium mb-2">Vote collègue du mois</p>
              <p className="text-sm text-muted-foreground mb-3">
                Qui mérite d'être collègue du mois ?
              </p>
              <ColleagueVoteDialog employeeId={employeeId} />
            </Card>

            {/* Mood Bar */}
            <Card className="p-4">
              <p className="font-medium mb-2">Mood Bar</p>
              <p className="text-sm text-muted-foreground mb-3">
                Comment vous sentez-vous ce mois-ci ?
              </p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleMoodRating(star)}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={cn(
                        "h-6 w-6",
                        moodRating && star <= moodRating 
                          ? "text-yellow-500 fill-yellow-500" 
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
              {savedMoodRating && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  ✓ Mood enregistré
                </p>
              )}
            </Card>
          </div>
        </div>

        {/* Cagnotte annuelle */}
        <div className="mb-8">
          <AnnualCagnotteWidget employeeId={employeeId} />
        </div>

        {/* Agenda du mois */}
        <div className="mb-8">
          <MonthCalendar />
        </div>

        {/* Historique récent */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Activité récente</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-green-500/10 rounded">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Objectif validé</p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
              <span className="text-sm font-medium text-green-600">+5 pts</span>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-orange-500/10 rounded">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">En attente de validation</p>
                <p className="text-xs text-muted-foreground">Hier à 16h30</p>
              </div>
              <span className="text-sm text-muted-foreground">En cours</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Employe;
