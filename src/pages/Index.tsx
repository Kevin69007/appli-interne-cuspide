import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { AgendaWidget } from "@/components/employe/AgendaWidget";
import { TachesWidget } from "@/components/employe/TachesWidget";
import { InfosImportantesWidget } from "@/components/employe/InfosImportantesWidget";
import { TachesPrioritairesWidget } from "@/components/employe/TachesPrioritairesWidget";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
  const { user, loading } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, show dashboard
      console.log("User authenticated:", user.email);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">{t('loading')}</div>
      </div>
    );
  }

  if (user) {
    // Show dashboard for authenticated users
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('welcome')}</h2>
            <p className="text-muted-foreground text-lg">
              {t('tagline')}
            </p>
          </div>

          {/* Widgets rapides pour tous les utilisateurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <AgendaWidget />
            <TachesWidget />
            <TachesPrioritairesWidget />
            <InfosImportantesWidget />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: t('navigation.formation'), icon: "📚", path: "/formation" },
              { title: t('navigation.indicators'), icon: "🎯", path: "/indicateurs-primes" },
              { title: t('navigation.tasks'), icon: "✅", path: "/taches" },
              { title: t('navigation.communication'), icon: "📢", path: "/communication-generale" },
              { title: t('navigation.projects'), icon: "🗂️", path: "/projets" },
              { title: t('navigation.meetings'), icon: "🎤", path: "/reunions" },
              { title: t('navigation.rh'), icon: "🌴", path: "/conges-mood-bar", restricted: true },
              { title: t('navigation.detente'), icon: "🎮", path: "/detente" },
              { title: t('navigation.translator'), icon: "🌐", path: "https://interne-traducteur.cuspide.fr/", external: true },
              { title: t('navigation.stock'), icon: "🛒", path: "/commandes-stock" },
              { title: t('navigation.planning'), icon: "📅", path: "/agenda" },
              { title: t('navigation.direction'), icon: "📊", path: "/suivi-direction", restricted: true },
            ].filter(item => !item.restricted || isAdmin || isManager).map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  if (item.external) {
                    window.open(item.path, '_blank', 'noopener,noreferrer');
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t('welcome')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t('tagline')}
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-opacity"
        >
          {t('auth:signIn')}
        </button>
      </div>
    </div>
  );
};

export default Index;
