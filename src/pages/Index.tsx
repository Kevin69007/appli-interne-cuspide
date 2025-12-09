import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployee } from "@/contexts/EmployeeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslation } from "react-i18next";
import { AgendaWidget } from "@/components/employe/AgendaWidget";
import { TachesWidget } from "@/components/employe/TachesWidget";
import { InfosImportantesWidget } from "@/components/employe/InfosImportantesWidget";
import { TachesPrioritairesWidget } from "@/components/employe/TachesPrioritairesWidget";
import { MoodBarWidget } from "@/components/employe/MoodBarWidget";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useModuleVisibility } from "@/hooks/useModuleVisibility";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import tuttiLogo from "@/assets/tutti-logo.png";

// Normalise le texte en supprimant les accents
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Mots-clés de recherche pour chaque module
const moduleKeywords: Record<string, string[]> = {
  "/conges-mood-bar": ["congé", "conges", "congés", "vacances", "absence", "demande congé", "rh", "humeur", "mood", "demande de vacance", "demande de congé"],
  "/taches": ["tache", "taches", "tâche", "tâches", "todo", "travail", "mission"],
  "/agenda": ["planning", "calendrier", "horaires", "emploi du temps", "agenda"],
  "/projets": ["projet", "projets", "chantier", "gestion de projet"],
  "/formation": ["formation", "documentation", "apprendre", "tutoriel", "quiz"],
  "/communication-generale": ["communication", "annonce", "message", "info", "information"],
  "/reunions": ["réunion", "reunion", "meeting", "rendez-vous", "rencontre"],
  "/commandes-stock": ["commande", "stock", "inventaire", "fourniture", "achat", "fournisseur"],
  "/indicateurs-primes": ["indicateur", "prime", "objectif", "bonus", "salaire", "performance"],
  "/suivi-direction": ["direction", "kpi", "tableau de bord", "dashboard", "suivi"],
  "/detente": ["détente", "detente", "jeu", "pause", "break", "divertissement"],
  "/entretiens-machines": ["entretien", "maintenance", "machine", "équipement"],
  "/job-documents": ["document", "fiche de poste", "poste", "emploi"],
  "/calendrier-projets": ["calendrier", "gantt", "timeline", "planning projet"],
};

const Index = () => {
  const { user, loading } = useAuth();
  const { employee } = useEmployee();
  const { isAdmin, isManager } = useUserRole();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { modules, loading: modulesLoading } = useModuleVisibility();
  
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [hasPriorityTasks, setHasPriorityTasks] = useState<boolean | null>(null);
  const [hasInfos, setHasInfos] = useState<boolean | null>(null);
  const [hasVotedMood, setHasVotedMood] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredModules = modules.filter(module => {
    if (!searchQuery.trim()) return true;
    
    const normalizedQuery = normalizeText(searchQuery);
    const normalizedName = normalizeText(module.module_name);
    
    // Recherche dans le nom du module
    if (normalizedName.includes(normalizedQuery)) return true;
    
    // Recherche dans les mots-clés
    const keywords = moduleKeywords[module.path] || [];
    return keywords.some(keyword => normalizeText(keyword).includes(normalizedQuery));
  });

  useEffect(() => {
    if (!loading && user) {
      console.log("User authenticated:", user.email);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-primary text-lg font-display animate-pulse">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen">
        <AnimatedBackground />
        <header className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={tuttiLogo} 
                alt="Tutti" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0 animate-pulse-glow"
              />
              <h1 className="text-lg sm:text-2xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('appName')}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Barre de recherche avec dropdown autocomplete */}
              <div className="relative hidden sm:block" ref={searchRef}>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                  className="pl-8 w-40 lg:w-56 h-9 glass border-border/50 text-sm"
                />
                {/* Dropdown des résultats */}
                {showSearchDropdown && searchQuery.trim() && (
                  <div className="absolute top-full left-0 w-64 lg:w-80 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {filteredModules.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Aucun module trouvé
                      </div>
                    ) : (
                      filteredModules.map((module) => (
                        <div
                          key={module.id}
                          onClick={() => {
                            if (module.is_external) {
                              window.open(module.path, '_blank', 'noopener,noreferrer');
                            } else {
                              navigate(module.path);
                            }
                            setSearchQuery("");
                            setShowSearchDropdown(false);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/30 last:border-b-0"
                        >
                          <span className="text-xl">{module.icon}</span>
                          <span className="text-sm font-medium">{module.module_name}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="hidden lg:inline-block text-sm text-muted-foreground truncate max-w-[150px]">{user.email}</span>
              <NotificationBell />
              {employee && (
                <EmployeeAvatar
                  photoUrl={employee.photo_url}
                  nom={employee.nom}
                  prenom={employee.prenom}
                  size="md"
                />
              )}
              <ThemeToggle />
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="px-3 py-2 sm:px-4 text-xs sm:text-sm border border-border rounded-lg hover:bg-accent/10 transition-colors shrink-0"
              >
                <span className="hidden sm:inline">{t('logout')}</span>
                <span className="sm:hidden">↗</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <h2 className="text-2xl sm:text-4xl font-display font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {t('welcome')}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg font-sans">
              {t('tagline')}
            </p>
          </div>

          {/* MoodBar - Au-dessus des widgets, disparaît après le vote */}
          {!hasVotedMood && (
            <div className="max-w-3xl mx-auto mb-8 sm:mb-12">
              <MoodBarWidget onVoted={setHasVotedMood} />
            </div>
          )}

          {/* Widgets rapides - Layout adaptatif centré selon le nombre */}
          {(() => {
            const visibleCount = 1 + (hasTasks ? 1 : 0) + (hasPriorityTasks ? 1 : 0) + (hasInfos ? 1 : 0);
            const gridClasses = 
              visibleCount === 1 ? "flex justify-center" :
              visibleCount === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto" :
              visibleCount === 3 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto" :
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6";
            
            return (
              <div className={`${gridClasses} mb-8 sm:mb-12`}>
                <div className={visibleCount === 1 ? "max-w-sm w-full" : ""}>
                  <AgendaWidget />
                </div>
                <TachesWidget onDataLoaded={setHasTasks} />
                <TachesPrioritairesWidget onDataLoaded={setHasPriorityTasks} />
                <InfosImportantesWidget onDataLoaded={setHasInfos} />
              </div>
            );
          })()}

          {/* Barre de recherche mobile avec dropdown */}
          <div className="relative max-w-md mx-auto mb-6 sm:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(e.target.value.trim().length > 0);
              }}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              className="pl-10 glass border-border/50"
            />
            {/* Dropdown mobile */}
            {showSearchDropdown && searchQuery.trim() && (
              <div className="absolute top-full left-0 w-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {filteredModules.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Aucun module trouvé
                  </div>
                ) : (
                  filteredModules.map((module) => (
                    <div
                      key={module.id}
                      onClick={() => {
                        if (module.is_external) {
                          window.open(module.path, '_blank', 'noopener,noreferrer');
                        } else {
                          navigate(module.path);
                        }
                        setSearchQuery("");
                        setShowSearchDropdown(false);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/30 last:border-b-0"
                    >
                      <span className="text-xl">{module.icon}</span>
                      <span className="text-sm font-medium">{module.module_name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Modules de navigation - toujours visibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {modulesLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass p-4 sm:p-6 rounded-xl animate-pulse">
                    <div className="w-12 h-12 bg-muted/50 rounded-lg mb-4" />
                    <div className="h-4 bg-muted/50 rounded w-3/4" />
                  </div>
                ))}
              </>
            ) : modules.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Aucun module disponible
              </div>
            ) : (
              modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => {
                    if (module.is_external) {
                      window.open(module.path, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate(module.path);
                    }
                  }}
                  className="group glass-hover p-4 sm:p-6 rounded-xl cursor-pointer hover-3d animate-fade-in"
                >
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {module.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-display font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {module.module_name}
                  </h3>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // Landing page pour utilisateurs non authentifiés
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AnimatedBackground />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <div className="mb-6 sm:mb-8 flex justify-center animate-fade-in-up">
          <img 
            src={tuttiLogo} 
            alt="Tutti" 
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-float drop-shadow-2xl"
          />
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in-up animation-delay-100">
          {t('welcome')}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 font-sans animate-fade-in-up animation-delay-200">
          {t('tagline')}
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 text-white font-display font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 animate-fade-in-up animation-delay-300 w-full sm:w-auto"
        >
          {t('auth:signIn')}
        </button>
      </div>
    </div>
  );
};

export default Index;