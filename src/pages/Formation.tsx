import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, BookOpen, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Formation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('formation');

  const sections = [
    {
      title: t('sections.jobDocuments'),
      description: t('descriptions.jobDocuments'),
      icon: FileText,
      path: "/fiches-de-poste",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: t('sections.protocols'),
      description: t('descriptions.protocols'),
      icon: BookOpen,
      path: "/protocoles",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: t('sections.quiz'),
      description: t('descriptions.quiz'),
      icon: Brain,
      path: "/quiz",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.path}
                onClick={() => navigate(section.path)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
              >
                <div className="p-8">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300" />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Formation;
