
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Baby, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface NurseryCardProps {
  breedingPair: any;
  onCardClick?: (breedingPair: any) => void;
}

const NurseryCard = ({ breedingPair, onCardClick }: NurseryCardProps) => {
  const [parent1, setParent1] = useState<any>(null);
  const [parent2, setParent2] = useState<any>(null);
  const [babies, setBabies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [breedingPair]);

  const fetchData = async () => {
    try {
      // Fetch parents with proper profile data
      const [parent1Response, parent2Response] = await Promise.all([
        supabase
          .from("user_pets")
          .select(`
            *,
            profiles!user_pets_user_id_fkey(username, profile_image_url)
          `)
          .eq("id", breedingPair.parent1_id)
          .maybeSingle(),
        supabase
          .from("user_pets")
          .select(`
            *,
            profiles!user_pets_user_id_fkey(username, profile_image_url)
          `)
          .eq("id", breedingPair.parent2_id)
          .maybeSingle()
      ]);

      if (parent1Response.data) setParent1(parent1Response.data);
      if (parent2Response.data) setParent2(parent2Response.data);

      // Fetch babies if the litter is born
      if (breedingPair.is_born) {
        const { data: babiesData } = await supabase
          .from("litter_babies")
          .select("*")
          .eq("breeding_pair_id", breedingPair.id)
          .order("created_at", { ascending: true });
        
        setBabies(babiesData || []);
      }
    } catch (error) {
      console.error("Error fetching nursery card data:", error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const birthDate = new Date(breedingPair.birth_date);
  const weanDate = new Date(breedingPair.wean_date);
  
  const getStage = () => {
    if (!breedingPair.is_born) {
      return { stage: "Expecting", color: "bg-blue-100 text-blue-800", icon: Clock };
    }
    if (breedingPair.is_born && now < weanDate) {
      return { stage: "Weaning", color: "bg-yellow-100 text-yellow-800", icon: Heart };
    }
    return { stage: "Ready", color: "bg-green-100 text-green-800", icon: Baby };
  };

  const getTimeDisplay = () => {
    if (!breedingPair.is_born) {
      const timeUntilBirth = Math.max(0, Math.ceil((birthDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return timeUntilBirth === 0 ? "Due now!" : `${timeUntilBirth} days until birth`;
    }
    if (breedingPair.is_born && now < weanDate) {
      const timeUntilWean = Math.max(0, Math.ceil((weanDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return timeUntilWean === 0 ? "Ready to wean!" : `${timeUntilWean} days until weaning`;
    }
    return "Babies ready for collection!";
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(breedingPair);
    }
  };

  const stageInfo = getStage();
  const StageIcon = stageInfo.icon;

  if (loading) {
    return (
      <Card className="animate-pulse bg-white/90 backdrop-blur-sm border-pink-200">
        <CardContent className="p-4">
          <div className="h-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border-pink-200"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <StageIcon className="w-4 h-4 text-pink-600" />
            <Badge className={`text-xs ${stageInfo.color}`}>
              {stageInfo.stage}
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            #{breedingPair.litter_number || 'N/A'}
          </div>
        </div>

        {/* Parent Images */}
        <div className="flex justify-center gap-2 mb-3">
          {parent1 && (
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-blue-200 overflow-hidden">
                <PetImageDisplay
                  pet={parent1}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                ♂
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          
          {parent2 && (
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-pink-200 overflow-hidden">
                <PetImageDisplay
                  pet={parent2}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                ♀
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900 text-center">
            {parent1?.pet_name} × {parent2?.pet_name}
          </div>
          <div className="text-xs text-gray-500 text-center">
            {parent1?.breed} × {parent2?.breed}
          </div>
          <div className="text-xs text-gray-600 text-center">
            {getTimeDisplay()}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>
              {breedingPair.is_born ? `${babies.length} babies` : `Expected: ${breedingPair.litter_size || "1-6"} babies`}
            </span>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Owner: {breedingPair.profiles?.username || 'Unknown'}
          </div>
        </div>

        {/* Show baby names only if litter is born */}
        {breedingPair.is_born && babies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2 text-center">Babies</div>
            <div className="space-y-1">
              {babies.slice(0, 3).map((baby) => (
                <div key={baby.id} className="text-xs text-center text-gray-600">
                  {baby.pet_name} ({baby.breed} • {baby.gender})
                </div>
              ))}
            </div>
            {babies.length > 3 && (
              <div className="text-xs text-gray-500 text-center mt-1">
                +{babies.length - 3} more
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NurseryCard;
