import { 
  CheckCircle2, 
  Rocket, 
  Zap, 
  Clock, 
  RotateCcw,
  Handshake,
  Briefcase,
  Building2,
  Lightbulb,
  Gem,
  Sparkles,
  Calendar,
  Sun,
  Star,
  Search,
  Crown as CrownIcon,
  Drama,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  GraduationCap
} from "lucide-react";

export type BadgeLevel = "bronze" | "silver" | "gold" | "platinum";
export type BadgeCategory = "tasks" | "projects" | "ideas" | "mood" | "game" | "objectives" | "training";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: BadgeCategory;
  level: BadgeLevel;
  condition: string;
  requiredCount: number;
  color: string;
}

export interface EmployeeLevel {
  level: number;
  name: string;
  emoji: string;
  minBadges: number;
  maxBadges: number;
  cardColor: string;
  glowEffect: boolean;
}

// Définition des niveaux
export const EMPLOYEE_LEVELS: EmployeeLevel[] = [
  {
    level: 1,
    name: "Petit nouveau",
    emoji: "🌱",
    minBadges: 0,
    maxBadges: 2,
    cardColor: "hsl(var(--border))",
    glowEffect: false
  },
  {
    level: 2,
    name: "En progression",
    emoji: "🌿",
    minBadges: 3,
    maxBadges: 5,
    cardColor: "hsl(217 91% 60%)",
    glowEffect: false
  },
  {
    level: 3,
    name: "Confirmé",
    emoji: "🌳",
    minBadges: 6,
    maxBadges: 9,
    cardColor: "hsl(142 71% 45%)",
    glowEffect: false
  },
  {
    level: 4,
    name: "Expert",
    emoji: "⭐",
    minBadges: 10,
    maxBadges: 14,
    cardColor: "hsl(43 96% 56%)",
    glowEffect: false
  },
  {
    level: 5,
    name: "Star de l'équipe",
    emoji: "🔥",
    minBadges: 15,
    maxBadges: 19,
    cardColor: "linear-gradient(135deg, hsl(43 96% 56%), hsl(25 95% 53%))",
    glowEffect: true
  },
  {
    level: 6,
    name: "Big Boss",
    emoji: "👑",
    minBadges: 20,
    maxBadges: 999,
    cardColor: "linear-gradient(135deg, hsl(43 96% 56%), hsl(280 89% 66%))",
    glowEffect: true
  }
];

// Définition de tous les badges (OBJECTIFS MENSUELS)
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // BADGES TÂCHES (bleu) - Objectifs mensuels
  {
    id: "finisher",
    name: "Finisseur",
    description: "Terminer 5 tâches dans le mois",
    icon: CheckCircle2,
    category: "tasks",
    level: "bronze",
    condition: "completed_tasks",
    requiredCount: 5,
    color: "hsl(217 91% 60%)"
  },
  {
    id: "productive",
    name: "Productif",
    description: "Terminer 15 tâches dans le mois",
    icon: Rocket,
    category: "tasks",
    level: "silver",
    condition: "completed_tasks",
    requiredCount: 15,
    color: "hsl(217 91% 60%)"
  },
  {
    id: "machine",
    name: "Machine",
    description: "Terminer 30 tâches dans le mois",
    icon: Zap,
    category: "tasks",
    level: "gold",
    condition: "completed_tasks",
    requiredCount: 30,
    color: "hsl(217 91% 60%)"
  },
  {
    id: "boomerang_master",
    name: "Boomerang Master",
    description: "Renvoyer 3 boomerangs dans le mois",
    icon: RotateCcw,
    category: "tasks",
    level: "silver",
    condition: "boomerangs_sent",
    requiredCount: 3,
    color: "hsl(217 91% 60%)"
  },

  // BADGES PROJETS (vert) - Objectifs mensuels
  {
    id: "collaborator",
    name: "Collaborateur",
    description: "Participer à 2 projets dans le mois",
    icon: Handshake,
    category: "projects",
    level: "bronze",
    condition: "projects_participated",
    requiredCount: 2,
    color: "hsl(142 71% 45%)"
  },
  {
    id: "project_manager",
    name: "Chef de projet",
    description: "Créer 1 projet dans le mois",
    icon: Briefcase,
    category: "projects",
    level: "silver",
    condition: "projects_created",
    requiredCount: 1,
    color: "hsl(142 71% 45%)"
  },

  // BADGES IDÉES (jaune) - Objectifs mensuels
  {
    id: "creative",
    name: "Créatif",
    description: "Soumettre 2 idées dans le mois",
    icon: Lightbulb,
    category: "ideas",
    level: "bronze",
    condition: "ideas_submitted",
    requiredCount: 2,
    color: "hsl(43 96% 56%)"
  },
  {
    id: "visionary",
    name: "Visionnaire",
    description: "Avoir 1 idée validée dans le mois",
    icon: Gem,
    category: "ideas",
    level: "gold",
    condition: "ideas_validated",
    requiredCount: 1,
    color: "hsl(43 96% 56%)"
  },

  // BADGES HUMEUR (rose) - Objectifs mensuels
  {
    id: "regular",
    name: "Régulier",
    description: "Voter 20 jours dans le mois",
    icon: Calendar,
    category: "mood",
    level: "bronze",
    condition: "mood_days",
    requiredCount: 20,
    color: "hsl(330 81% 60%)"
  },
  {
    id: "sunshine",
    name: "Soleil",
    description: "Avoir 15 humeurs positives dans le mois",
    icon: Sun,
    category: "mood",
    level: "silver",
    condition: "positive_moods",
    requiredCount: 15,
    color: "hsl(330 81% 60%)"
  },

  // BADGES JEU DÉTENTE (violet) - Objectifs mensuels
  {
    id: "investigator",
    name: "Enquêteur",
    description: "Participer à 2 sessions dans le mois",
    icon: Search,
    category: "game",
    level: "bronze",
    condition: "game_sessions",
    requiredCount: 2,
    color: "hsl(280 89% 66%)"
  },

  // BADGES OBJECTIFS (orange) - Objectifs mensuels
  {
    id: "goal_achiever",
    name: "Objectif atteint",
    description: "Valider 5 objectifs dans le mois",
    icon: Target,
    category: "objectives",
    level: "bronze",
    condition: "objectives_validated",
    requiredCount: 5,
    color: "hsl(25 95% 53%)"
  },
  {
    id: "performer",
    name: "Performant",
    description: "Valider 10 objectifs dans le mois",
    icon: TrendingUp,
    category: "objectives",
    level: "silver",
    condition: "objectives_validated",
    requiredCount: 10,
    color: "hsl(25 95% 53%)"
  }
];

// Helper pour obtenir le niveau d'un employé selon ses badges
export function getEmployeeLevel(badgeCount: number): EmployeeLevel {
  return EMPLOYEE_LEVELS.find(
    level => badgeCount >= level.minBadges && badgeCount <= level.maxBadges
  ) || EMPLOYEE_LEVELS[0];
}

// Helper pour obtenir la progression vers le prochain niveau
export function getProgressToNextLevel(badgeCount: number): {
  current: EmployeeLevel;
  next: EmployeeLevel | null;
  remaining: number;
  progress: number;
} {
  const current = getEmployeeLevel(badgeCount);
  const nextLevelIndex = EMPLOYEE_LEVELS.findIndex(l => l.level === current.level) + 1;
  const next = nextLevelIndex < EMPLOYEE_LEVELS.length ? EMPLOYEE_LEVELS[nextLevelIndex] : null;
  
  if (!next) {
    return { current, next, remaining: 0, progress: 100 };
  }

  const remaining = next.minBadges - badgeCount;
  const totalNeeded = next.minBadges - current.minBadges;
  const earned = badgeCount - current.minBadges;
  const progress = Math.round((earned / totalNeeded) * 100);

  return { current, next, remaining, progress };
}

// Helper pour obtenir les badges par catégorie
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(badge => badge.category === category);
}

// Helper pour obtenir un badge par ID
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(badge => badge.id === id);
}

// Obtenir la couleur d'un badge selon son niveau
export function getBadgeLevelColor(level: BadgeLevel): string {
  switch (level) {
    case "bronze":
      return "hsl(25 95% 53%)";
    case "silver":
      return "hsl(0 0% 70%)";
    case "gold":
      return "hsl(43 96% 56%)";
    case "platinum":
      return "hsl(280 89% 66%)";
    default:
      return "hsl(var(--muted))";
  }
}

// Obtenir le niveau d'un badge selon son compteur annuel
export function getBadgeTierFromCount(annualCount: number): {
  tier: "bronze" | "silver" | "gold" | "platinum";
  emoji: string;
  color: string;
} {
  if (annualCount >= 9) {
    return { tier: "platinum", emoji: "💎", color: "hsl(280 89% 66%)" };
  } else if (annualCount >= 6) {
    return { tier: "gold", emoji: "🥇", color: "hsl(43 96% 56%)" };
  } else if (annualCount >= 3) {
    return { tier: "silver", emoji: "🥈", color: "hsl(0 0% 70%)" };
  } else {
    return { tier: "bronze", emoji: "🥉", color: "hsl(25 95% 53%)" };
  }
}