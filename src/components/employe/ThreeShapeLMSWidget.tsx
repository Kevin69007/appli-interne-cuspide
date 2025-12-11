import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const THREE_SHAPE_URL = "https://identity.3shape.com/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fclient_id%3DLmsWebApp%26redirect_uri%3Dhttps%253A%252F%252Flms.3shape.com%252F3ui%252Fauthentication%252Flogin-callback%252F%26response_type%3Dcode%26scope%3Dopenid%2520profile%2520connections.read%2520api%2520openid%2520offline_access%2520profile%2520communicate.connections.read_only%2520communicate.connections.manage%2520data.companies.read_only%2520data.users.read_only%26state%3Decf4cee3b32f451f9712d706ea51d198%26code_challenge%3DY04gnmCC4X7lFG05DdE_rnSp9pPK0ys5trcK7L020-8%26code_challenge_method%3DS256%26response_mode%3Dquery";

export const ThreeShapeLMSWidget = () => {
  const handleOpenLMS = () => {
    window.open(THREE_SHAPE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="glass border-border/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4 flex flex-col items-center gap-3">
        <div className="text-3xl">🦷</div>
        <h3 className="font-display font-semibold text-sm text-center">3Shape LMS</h3>
        <Button 
          onClick={handleOpenLMS}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <span>Accéder à 3Shape LMS</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
};
