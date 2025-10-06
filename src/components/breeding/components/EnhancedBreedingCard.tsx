
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Baby, Eye } from "lucide-react";
import { useState } from "react";
import LitterDetailModal from "./LitterDetailModal";

interface EnhancedBreedingCardProps {
  breedingPair: any;
  title: string;
  description: string;
  children: React.ReactNode;
  showViewDetails?: boolean;
}

const EnhancedBreedingCard = ({ 
  breedingPair, 
  title, 
  description, 
  children, 
  showViewDetails = false 
}: EnhancedBreedingCardProps) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const getStageInfo = () => {
    const now = new Date();
    const weanDate = new Date(breedingPair.wean_date);
    
    if (breedingPair.is_completed) {
      return { stage: "Completed", color: "bg-gray-100 text-gray-800", icon: Baby };
    }
    if (!breedingPair.is_born) {
      return { stage: "Expecting", color: "bg-blue-100 text-blue-800", icon: Clock };
    }
    if (!breedingPair.is_weaned && now < weanDate) {
      return { stage: "Nursing", color: "bg-yellow-100 text-yellow-800", icon: Heart };
    }
    return { stage: "Ready", color: "bg-green-100 text-green-800", icon: Baby };
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <StageIcon className="w-5 h-5" />
                {title}
              </CardTitle>
              <Badge className={`${stageInfo.color}`}>
                {stageInfo.stage}
              </Badge>
            </div>
            {showViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>

      {/* Litter Detail Modal */}
      <LitterDetailModal
        breedingPair={breedingPair}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isPublicView={false}
      />
    </>
  );
};

export default EnhancedBreedingCard;
