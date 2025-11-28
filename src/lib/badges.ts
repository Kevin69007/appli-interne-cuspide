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

// Définition de tous les badges
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // BADGES TÂCHES (bleu)
  {
    id: "finisher",
    name: "Finisseur",
    description: "Terminer 10 tâches",
    icon: CheckCircle2,
    category: "tasks",
    level: "bronze",
    condition: "completed_tasks",
    requiredCount: 10,
    color: "hsl(217 91% 60%)"
  },
  {
    id: "productive",
    name: "Productif",
    description: "Terminer 50 tâches",
    icon: Rocket,
    category: "tasks",
    level: "silver",
    condition: "completed_tasks",
    requiredCount: 50,
    color: "hsl(217 91% 60%)"
  },
  {
    id: "machine",
    name: "Machine",
    description: "Terminer 100 tâches",
    icon: Zap,
    category: "tasks",
    level: "gold",
    condition: "completed_tasks",
    requiredCount: 100,
    color: "hsl(217 91% 60%)"
  },
  {
    id: "deadline_master",
    name: "Mr/Mme Deadline",
    description: "Terminer 20 tâches à temps",
    icon: Clock,
    category: "tasks",
    level: "silver",
    condition: "on_time_tasks",
    requiredCount: 20,
    color: "hsl(217 91% 60%)"
  },
  {
    id: "boomerang_master",
    name: "Boomerang Master",
    description: "Renvoyer 10 boomerangs",
    icon: RotateCcw,
    category: "tasks",
    level: "gold",
    condition: "boomerangs_sent",
    requiredCount: 10,
    color: "hsl(217 91% 60%)"
  },

  // BADGES PROJETS (vert)
  {
    id: "collaborator",
    name: "Collaborateur",
    description: "Participer à 5 projets",
    icon: Handshake,
    category: "projects",
    level: "bronze",
    condition: "projects_participated",
    requiredCount: 5,
    color: "hsl(142 71% 45%)"
  },
  {
    id: "project_manager",
    name: "Chef de projet",
    description: "Être responsable de 3 projets",
    icon: Briefcase,
    category: "projects",
    level: "silver",
    condition: "projects_created",
    requiredCount: 3,
    color: "hsl(142 71% 45%)"
  },
  {
    id: "builder",
    name: "Bâtisseur",
    description: "Terminer 5 projets à 100%",
    icon: Building2,
    category: "projects",
    level: "gold",
    condition: "projects_completed",
    requiredCount: 5,
    color: "hsl(142 71% 45%)"
  },

  // BADGES IDÉES (jaune)
  {
    id: "creative",
    name: "Créatif",
    description: "Soumettre 5 idées",
    icon: Lightbulb,
    category: "ideas",
    level: "bronze",
    condition: "ideas_submitted",
    requiredCount: 5,
    color: "hsl(43 96% 56%)"
  },
  {
    id: "visionary",
    name: "Visionnaire",
    description: "Avoir 3 idées validées",
    icon: Gem,
    category: "ideas",
    level: "gold",
    condition: "ideas_validated",
    requiredCount: 3,
    color: "hsl(43 96% 56%)"
  },
  {
    id: "innovator",
    name: "Innovateur",
    description: "Avoir 10 idées validées",
    icon: Sparkles,
    category: "ideas",
    level: "platinum",
    condition: "ideas_validated",
    requiredCount: 10,
    color: "hsl(43 96% 56%)"
  },

  // BADGES HUMEUR (rose)
  {
    id: "regular",
    name: "Régulier",
    description: "Voter 7 jours consécutifs",
    icon: Calendar,
    category: "mood",
    level: "bronze",
    condition: "mood_streak",
    requiredCount: 7,
    color: "hsl(330 81% 60%)"
  },
  {
    id: "sunshine",
    name: "Soleil",
    description: "Avoir 20 humeurs positives",
    icon: Sun,
    category: "mood",
    level: "silver",
    condition: "positive_moods",
    requiredCount: 20,
    color: "hsl(330 81% 60%)"
  },
  {
    id: "good_mood",
    name: "Mr/Mme Bonne Humeur",
    description: "Voter 30 jours consécutifs",
    icon: Star,
    category: "mood",
    level: "gold",
    condition: "mood_streak",
    requiredCount: 30,
    color: "hsl(330 81% 60%)"
  },

  // BADGES JEU DÉTENTE (violet)
  {
    id: "investigator",
    name: "Enquêteur",
    description: "Participer à 5 sessions",
    icon: Search,
    category: "game",
    level: "bronze",
    condition: "game_sessions",
    requiredCount: 5,
    color: "hsl(280 89% 66%)"
  },
  {
    id: "sherlock",
    name: "Sherlock",
    description: "Gagner 3 fois en enquêteur",
    icon: CrownIcon,
    category: "game",
    level: "silver",
    condition: "investigator_wins",
    requiredCount: 3,
    color: "hsl(280 89% 66%)"
  },
  {
    id: "mysterious",
    name: "Mystérieux",
    description: "Survivre 3 fois en cible",
    icon: Drama,
    category: "game",
    level: "gold",
    condition: "target_survivals",
    requiredCount: 3,
    color: "hsl(280 89% 66%)"
  },

  // BADGES OBJECTIFS (orange)
  {
    id: "goal_achiever",
    name: "Objectif atteint",
    description: "Valider 10 objectifs",
    icon: Target,
    category: "objectives",
    level: "bronze",
    condition: "objectives_validated",
    requiredCount: 10,
    color: "hsl(25 95% 53%)"
  },
  {
    id: "performer",
    name: "Performant",
    description: "Atteindre 500 pts cagnotte",
    icon: TrendingUp,
    category: "objectives",
    level: "silver",
    condition: "cagnotte_points",
    requiredCount: 500,
    color: "hsl(25 95% 53%)"
  },
  {
    id: "champion",
    name: "Champion",
    description: "Top 3 du mois 3 fois",
    icon: Award,
    category: "objectives",
    level: "gold",
    condition: "top_three",
    requiredCount: 3,
    color: "hsl(25 95% 53%)"
  },

  // BADGES FORMATION (cyan)
  {
    id: "learner",
    name: "Apprenant",
    description: "Compléter 5 quiz",
    icon: BookOpen,
    category: "training",
    level: "bronze",
    condition: "quizzes_completed",
    requiredCount: 5,
    color: "hsl(189 94% 43%)"
  },
  {
    id: "expert",
    name: "Expert",
    description: "Score moyen > 80%",
    icon: GraduationCap,
    category: "training",
    level: "silver",
    condition: "quiz_average",
    requiredCount: 80,
    color: "hsl(189 94% 43%)"
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