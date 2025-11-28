import { motion } from "framer-motion";
import { Award, Trophy, Sparkles, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BadgeCard } from "./BadgeCard";
import { useBadges } from "@/hooks/useBadges";
import { getProgressToNextLevel, getBadgesByCategory } from "@/lib/badges";
import { Loader2 } from "lucide-react";

interface BadgesSectionProps {
  employeeId: string;
}

export function BadgesSection({ employeeId }: BadgesSectionProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { badges, stats, loading, totalUnlocked } = useBadges(employeeId, currentMonth, currentYear);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const levelInfo = getProgressToNextLevel(totalUnlocked);

  return (
    <div className="space-y-6">
      {/* Header avec progression */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">
            Mes Badges ({totalUnlocked}/{badges.length})
          </h2>
        </div>

        {/* Niveau actuel */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{levelInfo.current.emoji}</span>
              <div>
                <p className="text-sm text-muted-foreground">Niveau actuel</p>
                <p className="text-xl font-bold">{levelInfo.current.name}</p>
              </div>
            </div>
            {levelInfo.next && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Prochain niveau</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  {levelInfo.next.emoji} {levelInfo.next.name}
                </p>
              </div>
            )}
          </div>

          {levelInfo.next && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Progression vers le niveau suivant
                </span>
                <span className="font-medium">
                  {levelInfo.remaining} badge{levelInfo.remaining > 1 ? "s" : ""} restant{levelInfo.remaining > 1 ? "s" : ""}
                </span>
              </div>
              <Progress value={levelInfo.progress} className="h-2" />
            </div>
          )}

          {!levelInfo.next && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <p className="font-medium">Niveau maximum atteint ! 🎉</p>
            </div>
          )}
        </Card>

        {/* Info sur le système mensuel */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Système de badges mensuels</strong>
            <br />
            Chaque mois, accomplissez les objectifs pour débloquer des badges. 
            Plus vous obtenez un badge dans l'année, plus il évolue : 🥉 Bronze → 🥈 Argent → 🥇 Or → 💎 Platine.
            Les compteurs se réinitialisent chaque mois pour maintenir le challenge !
          </AlertDescription>
        </Alert>
      </div>

      {/* Badges par catégorie */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="all">
            <Award className="w-4 h-4 mr-1" />
            Tous
          </TabsTrigger>
          <TabsTrigger value="tasks">🎯 Tâches</TabsTrigger>
          <TabsTrigger value="projects">📊 Projets</TabsTrigger>
          <TabsTrigger value="ideas">💡 Idées</TabsTrigger>
          <TabsTrigger value="mood">😊 Humeur</TabsTrigger>
          <TabsTrigger value="game">🎮 Jeu</TabsTrigger>
          <TabsTrigger value="objectives">🏆 Objectifs</TabsTrigger>
          <TabsTrigger value="training">🎓 Formation</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {badges
              .sort((a, b) => {
                // Trier par badges du mois en cours d'abord
                if (a.currentMonthUnlocked && !b.currentMonthUnlocked) return -1;
                if (!a.currentMonthUnlocked && b.currentMonthUnlocked) return 1;
                // Ensuite par compteur annuel
                if (a.annualCount !== b.annualCount) return b.annualCount - a.annualCount;
                // Enfin par progression
                return b.progress - a.progress;
              })
              .map((badgeProgress) => (
                <BadgeCard
                  key={badgeProgress.badgeId}
                  badgeProgress={badgeProgress}
                  size="medium"
                />
              ))}
          </div>
        </TabsContent>

        {(["tasks", "projects", "ideas", "mood", "game", "objectives", "training"] as const).map(
          (category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {badges
                  .filter((b) => b.badge.category === category)
                  .sort((a, b) => {
                    if (a.currentMonthUnlocked && !b.currentMonthUnlocked) return -1;
                    if (!a.currentMonthUnlocked && b.currentMonthUnlocked) return 1;
                    if (a.annualCount !== b.annualCount) return b.annualCount - a.annualCount;
                    return b.progress - a.progress;
                  })
                  .map((badgeProgress) => (
                    <BadgeCard
                      key={badgeProgress.badgeId}
                      badgeProgress={badgeProgress}
                      size="medium"
                    />
                  ))}
              </div>
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}