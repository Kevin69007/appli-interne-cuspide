import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Clock, Baby, AlertTriangle, CheckCircle, X, Loader2, Zap, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStreamlinedCollection } from "../hooks/useStreamlinedCollection";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import LitterBabiesGrid from "../LitterBabiesGrid";
import BabyProfileModal from "../BabyProfileModal";
import { renderBreedStats } from "@/utils/statBarUtils";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { generateBabyStats } from "../utils/statGeneration";
import { generateLitterBreedDistribution, generateGenderForBreed, postValidateAndCorrectGender } from "../utils/breedInheritance";
import { validateLitterBabies, performFinalGeneticValidation } from "@/utils/breedingUtils";

interface DetailedLitterModalProps {
  breedingPair: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isCompleted?: boolean;
  isPublicNurseryView?: boolean;
}

const DetailedLitterModal = ({ 
  breedingPair, 
  isOpen, 
  onClose, 
  onUpdate, 
  isCompleted = false,
  isPublicNurseryView = false 
}: DetailedLitterModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { collectBabies, isCollecting } = useStreamlinedCollection();
  
  const [parent1, setParent1] = useState<any>(null);
  const [parent2, setParent2] = useState<any>(null);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<any>(null);
  const [isBabyModalOpen, setIsBabyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accelerating, setAccelerating] = useState(false);

  useEffect(() => {
    if (isOpen && breedingPair) {
      fetchDetailedData();
    }
  }, [isOpen, breedingPair]);

  const fetchDetailedData = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 DetailedLitterModal: Fetching ACTUAL pet data for breeding pair:", breedingPair.id);
      
      // Fetch the ACTUAL parent pets with ALL their real data
      const [parent1Response, parent2Response] = await Promise.all([
        supabase
          .from("user_pets")
          .select(`
            *,
            pets(*)
          `)
          .eq("id", breedingPair.parent1_id)
          .maybeSingle(),
        supabase
          .from("user_pets")
          .select(`
            *,
            pets(*)
          `)
          .eq("id", breedingPair.parent2_id)
          .maybeSingle()
      ]);

      console.log("👨 DetailedLitterModal: Parent 1 ACTUAL response:", parent1Response);
      console.log("👩 DetailedLitterModal: Parent 2 ACTUAL response:", parent2Response);

      if (parent1Response.data && !parent1Response.error) {
        // Calculate FRESH current stats using the ACTUAL pet data
        const parent1WithCurrentStats = calculateCurrentStats(parent1Response.data);
        console.log("✅ DetailedLitterModal: Parent 1 with ACTUAL current stats:", {
          name: parent1WithCurrentStats.pet_name,
          breed: parent1WithCurrentStats.breed,
          gender: parent1WithCurrentStats.gender,
          actual_friendliness: parent1WithCurrentStats.friendliness,
          actual_playfulness: parent1WithCurrentStats.playfulness,
          actual_energy: parent1WithCurrentStats.energy,
          actual_loyalty: parent1WithCurrentStats.loyalty,
          actual_curiosity: parent1WithCurrentStats.curiosity,
          actual_hunger: parent1WithCurrentStats.hunger,
          actual_water: parent1WithCurrentStats.water
        });
        setParent1(parent1WithCurrentStats);
      } else {
        console.error("❌ DetailedLitterModal: Parent 1 fetch failed:", parent1Response.error);
        setParent1(null);
      }
      
      if (parent2Response.data && !parent2Response.error) {
        // Calculate FRESH current stats using the ACTUAL pet data
        const parent2WithCurrentStats = calculateCurrentStats(parent2Response.data);
        console.log("✅ DetailedLitterModal: Parent 2 with ACTUAL current stats:", {
          name: parent2WithCurrentStats.pet_name,
          breed: parent2WithCurrentStats.breed,
          gender: parent2WithCurrentStats.gender,
          actual_friendliness: parent2WithCurrentStats.friendliness,
          actual_playfulness: parent2WithCurrentStats.playfulness,
          actual_energy: parent2WithCurrentStats.energy,
          actual_loyalty: parent2WithCurrentStats.loyalty,
          actual_curiosity: parent2WithCurrentStats.curiosity,
          actual_hunger: parent2WithCurrentStats.hunger,
          actual_water: parent2WithCurrentStats.water
        });
        setParent2(parent2WithCurrentStats);
      } else {
        console.error("❌ DetailedLitterModal: Parent 2 fetch failed:", parent2Response.error);
        setParent2(null);
      }

      // Fetch babies if breeding pair is born
      if (breedingPair.is_born) {
        const { data: babiesData, error: babiesError } = await supabase
          .from("litter_babies")
          .select("*")
          .eq("breeding_pair_id", breedingPair.id)
          .order("created_at", { ascending: true });
        
        if (babiesError) {
          console.error("Error fetching babies:", babiesError);
        } else {
          setBabies(babiesData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching detailed litter data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccelerateConception = async () => {
    if (!user) return;

    setAccelerating(true);

    try {
      console.log("🚀 Starting Accelerate Conception for pair:", breedingPair.id);

      // Step 1: Check user's balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile || profile.paw_dollars < 50) {
        throw new Error("Insufficient Paw Dollars. You need 50 PD to accelerate conception.");
      }

      // Step 2: Deduct 50 PD from user's account
      const { error: deductError } = await supabase
        .from("profiles")
        .update({ paw_dollars: profile.paw_dollars - 50 })
        .eq("id", user.id);

      if (deductError) throw deductError;

      // Step 3: Record the PD transaction
      const { error: transactionError } = await supabase
        .from("paw_dollar_transactions")
        .insert({
          user_id: user.id,
          amount: -50,
          type: 'breeding_acceleration',
          description: 'Accelerated conception for breeding pair',
          status: 'completed'
        });

      if (transactionError) {
        console.error("⚠️ Transaction recording failed:", transactionError);
      }

      // Step 4: Generate 1-6 babies immediately using PROPER BOUNDED STATS
      const litterSize = Math.floor(Math.random() * 6) + 1;
      console.log(`🐣 Generating ${litterSize} babies for immediate conception`);

      if (!parent1 || !parent2) {
        throw new Error("Parent data not available for baby generation");
      }

      // Generate breed distribution with proper genetic inheritance
      const breedDistribution = generateLitterBreedDistribution(parent1, parent2, litterSize);
      console.log("🧬 DetailedLitterModal: Generated breed distribution:", breedDistribution);
      
      // Generate babies with STRICTLY BOUNDED stats and proper genetic validation
      const newBabies = [];
      for (let i = 0; i < litterSize; i++) {
        const babyBreed = breedDistribution[i];
        
        // CRITICAL: Generate genetically accurate gender for the breed
        const baseGender = generateGenderForBreed(babyBreed);
        
        // SAFETY: Post-validation to ensure no genetic violations
        const validatedGender = postValidateAndCorrectGender(babyBreed, baseGender, `Baby ${i + 1}`);
        
        // USE THE PROPER BOUNDED STAT GENERATION SYSTEM
        const babyStats = generateBabyStats(parent1, parent2, babyBreed);
        
        const baby = {
          breeding_pair_id: breedingPair.id,
          pet_name: `Baby ${i + 1}`,
          breed: babyBreed,
          gender: validatedGender,
          // Use the properly bounded stats from the generation system
          friendliness: babyStats.friendliness,
          playfulness: babyStats.playfulness,
          energy: babyStats.energy,
          loyalty: babyStats.loyalty,
          curiosity: babyStats.curiosity,
          birthday: new Date().toISOString().split('T')[0],
          parent1_breed: parent1.breed,
          parent2_breed: parent2.breed,
          description: `A lovely baby from ${parent1.pet_name} and ${parent2.pet_name}`
        };
        
        newBabies.push(baby);
      }

      // CRITICAL: Apply final genetic validation before database insertion
      const validatedBabies = validateLitterBabies(newBabies);
      const finalBabies = validatedBabies.map(baby => performFinalGeneticValidation(baby));
      
      console.log("🔒 DetailedLitterModal: Final validated babies before insertion:", finalBabies.map(b => ({ name: b.pet_name, breed: b.breed, gender: b.gender })));

      // Insert the genetically validated babies
      const { error: insertBabiesError } = await supabase
        .from("litter_babies")
        .insert(finalBabies);

      if (insertBabiesError) throw insertBabiesError;

      // Step 5: Update breeding pair to be born but NOT weaned yet - 2 weeks to wean
      const weanDate = new Date();
      weanDate.setDate(weanDate.getDate() + 14); // 2 weeks from now

      const { error: updatePairError } = await supabase
        .from("breeding_pairs")
        .update({
          is_born: true,
          is_weaned: false, // NOT weaned yet - needs 2 weeks
          birth_date: new Date().toISOString(),
          wean_date: weanDate.toISOString() // 2 weeks from now
        })
        .eq("id", breedingPair.id);

      if (updatePairError) throw updatePairError;

      console.log("🎉 Accelerate Conception completed successfully with BOUNDED stats!");

      toast({
        title: "🚀 Conception Accelerated!",
        description: `Success! Generated ${litterSize} babies instantly with proper stat boundaries. Now weaning for 2 weeks. 50 PD deducted.`,
        duration: 4000,
      });

      if (onUpdate) {
        onUpdate();
      }
      
      // Refresh the modal data
      fetchDetailedData();
    } catch (error: any) {
      console.error("❌ Error accelerating conception:", error);
      toast({
        title: "Acceleration Failed",
        description: error.message || "Failed to accelerate conception",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setAccelerating(false);
    }
  };

  const handleCollectBabies = async () => {
    if (!user || !breedingPair?.id) return;
    
    const success = await collectBabies(breedingPair.id, user.id);
    if (success) {
      onUpdate();
      onClose();
    }
  };

  const handleBabyNameClick = (baby: any) => {
    setSelectedBaby(baby);
    setIsBabyModalOpen(true);
  };

  const getStageInfo = () => {
    const now = new Date();
    const weanDate = new Date(breedingPair.wean_date);
    
    if (breedingPair.is_completed) {
      return { stage: "Completed", color: "bg-gray-100 text-gray-800", icon: CheckCircle };
    }
    if (!breedingPair.is_born) {
      return { stage: "Expecting", color: "bg-blue-100 text-blue-800", icon: Clock };
    }
    if (breedingPair.is_born && now < weanDate) {
      return { stage: "Weaning", color: "bg-yellow-100 text-yellow-800", icon: Heart };
    }
    return { stage: "Ready", color: "bg-green-100 text-green-800", icon: Baby };
  };

  const shouldShowCollectButton = () => {
    if (isPublicNurseryView) return false;
    if (!user || breedingPair.user_id !== user.id) return false;
    if (breedingPair.is_completed) return false;
    if (!breedingPair.is_born) return false;
    if (babies.length === 0) return false;
    
    const now = new Date();
    const weanDate = new Date(breedingPair.wean_date);
    
    return now >= weanDate;
  };

  // Check if we can accelerate conception (not born yet and not ready to birth)
  const canAccelerateConception = !breedingPair.is_born && user && breedingPair.user_id === user.id;

  // Determine mother and father based on gender with proper fallback
  const getMother = () => {
    if (!parent1 || !parent2) return parent1; // fallback if data missing
    
    // Check if parent1 is female
    if (parent1?.gender?.toLowerCase() === 'female') return parent1;
    
    // Check if parent2 is female  
    if (parent2?.gender?.toLowerCase() === 'female') return parent2;
    
    // If neither has clear gender or both are unknown, use parent1 as fallback
    return parent1;
  };

  const getFather = () => {
    if (!parent1 || !parent2) return parent2; // fallback if data missing
    
    // Check if parent1 is male
    if (parent1?.gender?.toLowerCase() === 'male') return parent1;
    
    // Check if parent2 is male
    if (parent2?.gender?.toLowerCase() === 'male') return parent2;
    
    // If neither has clear gender or both are unknown, use parent2 as fallback
    return parent2;
  };

  const getStatColor = (value: number) => {
    if (value >= 70) return "text-green-600";
    if (value >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  // Render parent with ACCURATE CALCULATED STATS from the actual pet data
  const renderParentWithStats = (pet: any, title: string, isFemale: boolean) => {
    if (!pet) {
      return (
        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-3 flex items-center justify-center">
            <span className="text-gray-400">?</span>
          </div>
          <p className="text-sm text-gray-500">{title} data unavailable</p>
        </div>
      );
    }

    const bgColor = isFemale ? "bg-pink-50" : "bg-blue-50";
    const borderColor = isFemale ? "border-pink-200" : "border-blue-200";
    const textColor = isFemale ? "text-pink-800" : "text-blue-800";
    const genderColor = isFemale ? "bg-pink-500" : "bg-blue-500";
    const genderSymbol = isFemale ? "♀" : "♂";

    // Display the EXACT calculated stats from the actual pet data
    console.log("🔍 DetailedLitterModal: Rendering parent with ACTUAL CALCULATED stats:", pet.pet_name, {
      actual_friendliness: pet.friendliness,
      actual_playfulness: pet.playfulness,
      actual_energy: pet.energy,
      actual_loyalty: pet.loyalty,
      actual_curiosity: pet.curiosity,
      actual_hunger: pet.hunger,
      actual_water: pet.water
    });

    return (
      <div className={`flex flex-col items-center p-4 ${bgColor} rounded-lg relative`}>
        <div className="relative mb-3">
          <div className={`w-16 h-16 rounded-full border-2 ${borderColor} overflow-hidden flex-shrink-0`}>
            <PetImageDisplay
              pet={pet}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Position symbol like babies - bottom right of image */}
          <div className={`absolute -bottom-1 -right-1 ${genderColor} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white`}>
            {genderSymbol}
          </div>
        </div>
        <div className="text-center w-full mb-4">
          <h3 className={`font-semibold ${textColor}`}>
            {pet.pet_name || 'Unknown'}
          </h3>
          <p className={`text-sm ${textColor.replace('800', '600')}`}>
            {pet.breed || 'Unknown breed'}
          </p>
          <div className={`text-xs ${textColor.replace('800', '500')} mt-1`}>
            {isFemale ? 'Mother' : 'Father'}
          </div>
        </div>
        {/* Parent Stats - Using the EXACT CALCULATED stats from actual pet data */}
        <div className="w-full space-y-2">
          <h4 className={`text-sm font-semibold ${textColor.replace('800', '700')} mb-2`}>Current Stats</h4>
          {renderBreedStats(pet, getStatColor, true)}
        </div>
      </div>
    );
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            <span className="ml-2">Loading litter details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const mother = getMother();
  const father = getFather();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StageIcon className="w-6 h-6 text-pink-600" />
                <div>
                  <h2 className="text-2xl font-bold text-pink-800">
                    Litter #{breedingPair.litter_number || 'N/A'}
                  </h2>
                  <Badge className={`${stageInfo.color} mt-1`}>
                    {stageInfo.stage}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Accelerate Conception Button */}
                {canAccelerateConception && (
                  <Button
                    onClick={handleAccelerateConception}
                    disabled={accelerating}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    <Coins className="w-4 h-4" />
                    <Zap className="w-4 h-4" />
                    {accelerating ? "Accelerating..." : "Accelerate (50 PD)"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Parents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Parents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mother (Female) */}
                  {renderParentWithStats(mother, "Mother", true)}
                  {/* Father (Male) */}
                  {renderParentWithStats(father, "Father", false)}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Started:</div>
                    <div className="text-gray-600">
                      {new Date(breedingPair.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Birth Date:</div>
                    <div className="text-gray-600">
                      {new Date(breedingPair.birth_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Wean Date:</div>
                    <div className="text-gray-600">
                      {new Date(breedingPair.wean_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collection Alert - Only show when current date is after wean date */}
            {shouldShowCollectButton() && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Ready for Collection</h3>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  {babies.length} babies are ready to be transferred to your profile.
                </p>
                <Button
                  onClick={handleCollectBabies}
                  disabled={isCollecting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCollecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Collecting...
                    </>
                  ) : (
                    <>
                      <Baby className="w-4 h-4 mr-2" />
                      Collect Babies Now
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Babies Section */}
            {breedingPair.is_born && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-purple-500" />
                    Babies ({babies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {babies.length > 0 ? (
                    <LitterBabiesGrid
                      babies={babies}
                      onAdoptBaby={() => {}}
                      userCanAdopt={false}
                      onBabyNameClick={handleBabyNameClick}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No babies found for this litter
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Baby Profile Modal */}
      {selectedBaby && (
        <BabyProfileModal
          baby={selectedBaby}
          isOpen={isBabyModalOpen}
          onClose={() => {
            setIsBabyModalOpen(false);
            setSelectedBaby(null);
          }}
          onUpdate={fetchDetailedData}
        />
      )}
    </>
  );
};

export default DetailedLitterModal;
