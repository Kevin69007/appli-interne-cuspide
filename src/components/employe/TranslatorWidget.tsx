import { Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TRANSLATOR_URL = "https://interne-traducteur.cuspide.fr/";

export const TranslatorWidget = () => {
  const handleOpenTranslator = () => {
    window.open(TRANSLATOR_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="glass border-border/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4 flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Globe className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-display font-semibold text-sm text-center">Traducteur</h3>
        <Button 
          onClick={handleOpenTranslator}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <span>Accéder au Traducteur</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
};
