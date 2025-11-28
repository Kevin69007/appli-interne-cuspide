import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, TrendingUp } from "lucide-react";
import type { BadgeProgress } from "@/hooks/useBadges";
import { getBadgeTierFromCount } from "@/lib/badges";

interface BadgeCardProps {
  badgeProgress: BadgeProgress;
  size?: "small" | "medium" | "large";
}

export function BadgeCard({ badgeProgress, size = "medium" }: BadgeCardProps) {
  const { badge, currentMonthUnlocked, progress, annualCount } = badgeProgress;
  const Icon = badge.icon;
  const tier = getBadgeTierFromCount(annualCount);

  const sizes = {
    small: {
      card: "p-2",
      icon: "w-6 h-6",
      text: "text-xs",
      badge: "text-[10px] px-1 py-0"
    },
    medium: {
      card: "p-3",
      icon: "w-8 h-8",
      text: "text-sm",
      badge: "text-xs"
    },
    large: {
      card: "p-4",
      icon: "w-12 h-12",
      text: "text-base",
      badge: "text-sm"
    }
  };

  // Utiliser la couleur du tier si le badge a été obtenu au moins une fois
  const displayColor = annualCount > 0 ? tier.color : badge.color;
  const isUnlocked = annualCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`${sizes[size].card} relative overflow-hidden transition-all hover:shadow-lg ${
          isUnlocked
            ? "bg-gradient-to-br from-background to-muted border-2"
            : "bg-muted/50 opacity-60"
        }`}
        style={{
          borderColor: isUnlocked ? displayColor : "transparent"
        }}
      >
        {/* Compteur annuel + Tier */}
        {annualCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Badge
              className={`${sizes[size].badge} font-bold`}
              style={{
                backgroundColor: tier.color,
                color: "white"
              }}
            >
              {tier.emoji} x{annualCount}
            </Badge>
          </div>
        )}

        {/* Badge ce mois */}
        {currentMonthUnlocked && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className={`${sizes[size].badge} bg-green-500`}>
              ✓ Ce mois
            </Badge>
          </div>
        )}

        {/* Icon */}
        <div className="flex items-center justify-center mb-2 mt-6">
          <div
            className={`rounded-full p-2 ${isUnlocked ? "bg-background" : "bg-muted"}`}
            style={{
              backgroundColor: isUnlocked ? `${displayColor}20` : undefined
            }}
          >
            {isUnlocked ? (
              <Icon
                className={sizes[size].icon}
                style={{ color: displayColor }}
              />
            ) : (
              <Lock className={`${sizes[size].icon} text-muted-foreground`} />
            )}
          </div>
        </div>

        {/* Name */}
        <h4
          className={`font-semibold text-center mb-1 ${sizes[size].text} ${
            isUnlocked ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {badge.name}
        </h4>

        {/* Description */}
        <p
          className={`text-center text-muted-foreground mb-2 ${
            size === "small" ? "text-[10px]" : "text-xs"
          }`}
        >
          {badge.description}
        </p>

        {/* Progress du mois en cours */}
        {!currentMonthUnlocked && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progression ce mois</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Progression vers le tier suivant */}
        {isUnlocked && (
          <div className="mt-2 text-center">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              {annualCount < 3 && `Vers 🥈: ${3 - annualCount} restant(s)`}
              {annualCount >= 3 && annualCount < 6 && `Vers 🥇: ${6 - annualCount} restant(s)`}
              {annualCount >= 6 && annualCount < 9 && `Vers 💎: ${9 - annualCount} restant(s)`}
              {annualCount >= 9 && `💎 Platine atteint!`}
            </p>
          </div>
        )}

        {/* Unlocked indicator */}
        {isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div
              className="absolute inset-0 bg-gradient-to-tr opacity-10"
              style={{
                backgroundImage: `linear-gradient(to top right, ${displayColor}, transparent)`
              }}
            />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}