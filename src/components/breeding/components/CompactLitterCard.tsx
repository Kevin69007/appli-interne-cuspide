
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Baby, Eye, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface CompactLitterCardProps {
  breedingPair: any;
  onViewDetails: () => void;
  onUpdate?: () => void;
  isCompleted?: boolean;
}

const CompactLitterCard = ({ breedingPair, onViewDetails, onUpdate, isCompleted = false }: CompactLitterCardProps) => {
  // Use parents from the breedingPair prop if available, otherwise fetch them
  const [parent1, setParent1] = useState<any>(breedingPair.parent1 || null);
  const [parent2, setParent2] = useState<any>(breedingPair.parent2 || null);
  const [loading, setLoading] = useState(!breedingPair.parent1 || !breedingPair.parent2);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch parents if we don't already have them from the prop
    if (!breedingPair.parent1 || !breedingPair.parent2) {
      fetchParents();
    } else {
      setParent1(breedingPair.parent1);
      setParent2(breedingPair.parent2);
      setLoading(false);
    }
  }, [breedingPair]);

  const fetchParents = async () => {
    try {
      console.log("🔍 CompactLitterCard: Fetching parents for breeding pair:", breedingPair.id);
      console.log("📋 CompactLitterCard: Parent IDs:", breedingPair.parent1_id, breedingPair.parent2_id);
      
      // Fetch both parents with comprehensive data
      const [parent1Response, parent2Response] = await Promise.all([
        supabase
          .from("user_pets")
          .select(`
            *,
            pets(*),
            profiles!user_pets_user_id_fkey(username, profile_image_url)
          `)
          .eq("id", breedingPair.parent1_id)
          .maybeSingle(),
        supabase
          .from("user_pets")
          .select(`
            *,
            pets(*),
            profiles!user_pets_user_id_fkey(username, profile_image_url)
          `)
          .eq("id", breedingPair.parent2_id)
          .maybeSingle()
      ]);

      console.log("👨 CompactLitterCard: Parent 1 response:", parent1Response);
      console.log("👩 CompactLitterCard: Parent 2 response:", parent2Response);

      if (parent1Response.data && !parent1Response.error) {
        console.log("✅ CompactLitterCard: Parent 1 loaded:", parent1Response.data.pet_name);
        setParent1(parent1Response.data);
      } else {
        console.warn("⚠️ CompactLitterCard: Parent 1 not found, using backup data");
        setParent1({
          id: breedingPair.parent1_id,
          pet_name: breedingPair.parent1_name || 'Parent 1',
          breed: breedingPair.parent1_breed || 'Unknown',
          pets: null
        });
      }
      
      if (parent2Response.data && !parent2Response.error) {
        console.log("✅ CompactLitterCard: Parent 2 loaded:", parent2Response.data.pet_name);
        setParent2(parent2Response.data);
      } else {
        console.warn("⚠️ CompactLitterCard: Parent 2 not found, using backup data");
        setParent2({
          id: breedingPair.parent2_id,
          pet_name: breedingPair.parent2_name || 'Parent 2',
          breed: breedingPair.parent2_breed || 'Unknown',
          pets: null
        });
      }
    } catch (error) {
      console.error("❌ CompactLitterCard: Error fetching parents:", error);
      
      // Use backup data on error
      setParent1({
        id: breedingPair.parent1_id,
        pet_name: breedingPair.parent1_name || 'Parent 1',
        breed: breedingPair.parent1_breed || 'Unknown',
        pets: null
      });
      setParent2({
        id: breedingPair.parent2_id,
        pet_name: breedingPair.parent2_name || 'Parent 2',
        breed: breedingPair.parent2_breed || 'Unknown',
        pets: null
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageInfo = () => {
    const now = new Date();
    const weanDate = new Date(breedingPair.wean_date);
    
    if (breedingPair.is_completed) {
      return { stage: "Completed", color: "bg-gray-100 text-gray-800", icon: Baby };
    }
    if (!breedingPair.is_born) {
      return { stage: "Expecting", color: "bg-blue-100 text-blue-800", icon: Clock };
    }
    if (breedingPair.is_born && now < weanDate) {
      return { stage: "Weaning", color: "bg-yellow-100 text-yellow-800", icon: Heart };
    }
    return { stage: "Ready", color: "bg-green-100 text-green-800", icon: Baby };
  };

  const stageInfo = getStageInfo();
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
    <Card className="bg-white/90 backdrop-blur-sm border-pink-200 hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StageIcon className="w-4 h-4 text-pink-600" />
            <Badge className={`text-xs ${stageInfo.color}`}>
              {stageInfo.stage}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            #{breedingPair.litter_number || 'N/A'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {/* Parent Images */}
        <div className="flex justify-center gap-2 mb-3">
          {parent1 ? (
            <div className="relative flex-1">
              <div className="relative w-12 h-12 rounded-full border-2 border-blue-200 overflow-hidden mx-auto mb-3">
                <PetImageDisplay
                  pet={parent1}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Gender icon positioned outside and below the pet image */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm">
                ♂
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="w-12 h-12 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          )}
          
          <div className="flex items-center px-2">
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          
          {parent2 ? (
            <div className="relative flex-1">
              <div className="relative w-12 h-12 rounded-full border-2 border-pink-200 overflow-hidden mx-auto mb-3">
                <PetImageDisplay
                  pet={parent2}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Gender icon positioned outside and below the pet image */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm">
                ♀
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="w-12 h-12 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Parent Names */}
        <div className="text-center mb-3">
          <div className="text-sm font-medium text-gray-900 truncate">
            {parent1?.pet_name || 'Parent 1'} × {parent2?.pet_name || 'Parent 2'}
          </div>
          <div className="text-xs text-gray-500">
            {parent1?.breed || 'Unknown'} × {parent2?.breed || 'Unknown'}
          </div>
        </div>

        {/* Litter Info */}
        <div className="space-y-2 mb-4">
          <div className="text-xs text-center text-gray-500">
            {breedingPair.is_completed 
              ? `Completed ${new Date(breedingPair.wean_date).toLocaleDateString()}`
              : !breedingPair.is_born 
                ? `Due ${new Date(breedingPair.birth_date).toLocaleDateString()}`
                : `Ready ${new Date(breedingPair.wean_date).toLocaleDateString()}`
            }
          </div>
        </div>

        {/* View Details Button */}
        <Button
          onClick={onViewDetails}
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2 group-hover:bg-pink-50 group-hover:border-pink-300"
        >
          <Eye className="w-4 h-4" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompactLitterCard;
