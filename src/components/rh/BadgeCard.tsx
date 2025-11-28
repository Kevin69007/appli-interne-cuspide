import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";
import type { BadgeProgress } from "@/hooks/useBadges";
import { getBadgeLevelColor } from "@/lib/badges";

interface BadgeCardProps {
  badgeProgress: BadgeProgress;
  size?: "small" | "medium" | "large";
}

export function BadgeCard({ badgeProgress, size = "medium" }: BadgeCardProps) {
  const { badge, unlocked, progress } = badgeProgress;
  const Icon = badge.icon;

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`${sizes[size].card} relative overflow-hidden transition-all hover:shadow-lg ${
          unlocked
            ? "bg-gradient-to-br from-background to-muted border-2"
            : "bg-muted/50 opacity-60"
        }`}
        style={{
          borderColor: unlocked ? badge.color : "transparent"
        }}
      >
        {/* Badge Level */}
        {unlocked && (
          <Badge
            className={`absolute top-2 right-2 ${sizes[size].badge}`}
            style={{
              backgroundColor: getBadgeLevelColor(badge.level),
              color: "white"
            }}
          >
            {badge.level}
          </Badge>
        )}

        {/* Icon */}
        <div className="flex items-center justify-center mb-2">
          <div
            className={`rounded-full p-2 ${unlocked ? "bg-background" : "bg-muted"}`}
            style={{
              backgroundColor: unlocked ? `${badge.color}20` : undefined
            }}
          >
            {unlocked ? (
              <Icon
                className={sizes[size].icon}
                style={{ color: badge.color }}
              />
            ) : (
              <Lock className={`${sizes[size].icon} text-muted-foreground`} />
            )}
          </div>
        </div>

        {/* Name */}
        <h4
          className={`font-semibold text-center mb-1 ${sizes[size].text} ${
            unlocked ? "text-foreground" : "text-muted-foreground"
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

        {/* Progress */}
        {!unlocked && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-center text-[10px] text-muted-foreground">
              {progress}%
            </p>
          </div>
        )}

        {/* Unlocked indicator */}
        {unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div
              className="absolute inset-0 bg-gradient-to-tr opacity-10"
              style={{
                backgroundImage: `linear-gradient(to top right, ${badge.color}, transparent)`
              }}
            />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}