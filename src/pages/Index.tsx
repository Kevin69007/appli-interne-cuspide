import { useEffect, useState } from "react";
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
import tuttiLogo from "@/assets/tutti-logo.png";

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
              <span className="hidden md:inline-block text-sm text-muted-foreground truncate max-w-[150px] lg:max-w-none">{user.email}</span>
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

          {/* Widgets rapides - Toujours visibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <AgendaWidget />
            <TachesWidget onDataLoaded={setHasTasks} />
            <TachesPrioritairesWidget onDataLoaded={setHasPriorityTasks} />
            <InfosImportantesWidget onDataLoaded={setHasInfos} />
          </div>

          {/* MoodBar - En dessous des widgets, disparaît après le vote */}
          {!hasVotedMood && (
            <div className="max-w-3xl mx-auto mb-8 sm:mb-12">
              <MoodBarWidget onVoted={setHasVotedMood} />
            </div>
          )}

          {/* Modules de navigation */}
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