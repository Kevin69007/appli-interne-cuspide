import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { AgendaWidget } from "@/components/employe/AgendaWidget";
import { TachesWidget } from "@/components/employe/TachesWidget";
import { InfosImportantesWidget } from "@/components/employe/InfosImportantesWidget";
import { TachesPrioritairesWidget } from "@/components/employe/TachesPrioritairesWidget";
import { MoodBarWidget } from "@/components/employe/MoodBarWidget";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useModuleVisibility } from "@/hooks/useModuleVisibility";

const Index = () => {
  const { user, loading } = useAuth();
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
    // Compter le nombre de widgets avec données
    const widgetsWithData = [hasTasks, hasPriorityTasks, hasInfos].filter(v => v === true).length;
    const showMoodBar = !hasVotedMood && widgetsWithData < 3;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <header className="glass border-b border-border/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center animate-pulse-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('appName')}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <LanguageSwitcher />
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent/10 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {t('welcome')}
            </h2>
            <p className="text-muted-foreground text-lg font-sans">
              {t('tagline')}
            </p>
          </div>

          {/* Widgets rapides - Layout intelligent */}
          {widgetsWithData === 0 && showMoodBar ? (
            // Cas 1: Aucun widget avec données → MoodBar en héros
            <div className="max-w-3xl mx-auto mb-12">
              <MoodBarWidget onVoted={setHasVotedMood} />
            </div>
          ) : (
            // Cas 2 & 3: Au moins 1 widget avec données
            <div className={`grid gap-6 mb-12 ${
              widgetsWithData >= 3 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
                : showMoodBar 
                  ? 'grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              <AgendaWidget />
              <TachesWidget onDataLoaded={setHasTasks} />
              <TachesPrioritairesWidget onDataLoaded={setHasPriorityTasks} />
              <InfosImportantesWidget onDataLoaded={setHasInfos} />
              
              {showMoodBar && (
                <div className={widgetsWithData >= 3 ? 'col-span-full' : 'lg:col-span-1'}>
                  <MoodBarWidget onVoted={setHasVotedMood} />
                </div>
              )}
            </div>
          )}

          {/* Modules de navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulesLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {t('loading')}
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
                  className="group glass-hover p-6 rounded-xl cursor-pointer hover-3d animate-fade-in"
                >
                  <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {module.icon}
                  </div>
                  <h3 className="text-lg font-display font-semibold group-hover:text-primary transition-colors">
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8 flex justify-center animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center animate-float shadow-2xl shadow-primary/40">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in-up animation-delay-100">
          {t('welcome')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 font-sans animate-fade-in-up animation-delay-200">
          {t('tagline')}
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 text-white font-display font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 animate-fade-in-up animation-delay-300"
        >
          {t('auth:signIn')}
        </button>
      </div>
    </div>
  );
};

export default Index;