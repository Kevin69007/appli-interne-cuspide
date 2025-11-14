import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('notfound');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-2xl font-semibold mt-4 mb-2">{t('subtitle')}</p>
        <p className="text-muted-foreground mb-8">
          {t('description')}
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-opacity"
        >
          <Home className="w-5 h-5" />
          {t('backHome')}
        </button>
      </div>
    </div>
  );
};

export default NotFound;
