
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Baby, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateBabyStats } from "./utils/statGeneration";
import { generateLitterBreedDistribution } from "./utils/breedInheritance";
import { validateAndFixBabyStats } from "./utils/statValidation";
import { generateRandomName, generateRandomGender } from "./utils/babyNameGenerator";

interface AccelerationItemProps {
  breedingPairs: any[];
  onUpdate: () => void;
}

const AccelerationItem = ({ breedingPairs, onUpdate }: AccelerationItemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accelerating, setAccelerating] = useState<{ [key: string]: boolean }>({});

  const handleAccelerateConception = async (breedingPairId: string) => {
    if (!user) return;

    setAccelerating(prev => ({ ...prev, [breedingPairId]: true }));

    try {
      console.log("🚀 Starting Accelerate Conception for pair:", breedingPairId);

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
        // Don't throw here - the main action succeeded
      }

      // Step 4: Get breeding pair and parent data
      const { data: breedingPair, error: pairError } = await supabase
        .from("breeding_pairs")
        .select("*")
        .eq("id", breedingPairId)
        .single();

      if (pairError) throw pairError;

      const { data: parent1, error: parent1Error } = await supabase
        .from("user_pets")
        .select("*")
        .eq("id", breedingPair.parent1_id)
        .single();

      const { data: parent2, error: parent2Error } = await supabase
        .from("user_pets")
        .select("*")
        .eq("id", breedingPair.parent2_id)
        .single();

      if (parent1Error || parent2Error || !parent1 || !parent2) {
        throw new Error("Failed to fetch parent pets for baby generation");
      }

      // Step 5: Generate 1-6 babies with proper breed distribution
      const litterSize = Math.floor(Math.random() * 6) + 1; // 1-6 babies
      console.log(`🐣 Generating ${litterSize} babies for immediate conception`);

      // Generate breed distribution for the entire litter to ensure variety
      const breedDistribution = generateLitterBreedDistribution(parent1, parent2, litterSize);

      const newBabies = [];
      for (let i = 0; i < litterSize; i++) {
        // Use the pre-calculated breed distribution
        const babyBreed = breedDistribution[i];
        
        // Generate gender (ensure Torties are female)
        const babyGender = generateRandomGender(babyBreed);
        
        // Generate BOUNDED stats using the proper utility
        const babyStats = generateBabyStats(parent1, parent2, babyBreed);
        
        const baby = {
          breeding_pair_id: breedingPairId,
          pet_name: generateRandomName(),
          breed: babyBreed,
          gender: babyGender,
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
        
        // VALIDATE AND FIX ANY OVER-STATS as final safety check
        const validatedBaby = validateAndFixBabyStats(baby, parent1.breed, parent2.breed);
        
        console.log(`🍼 Generated BOUNDED baby ${i + 1}:`, {
          name: validatedBaby.pet_name,
          breed: validatedBaby.breed,
          gender: validatedBaby.gender,
          stats: {
            friendliness: validatedBaby.friendliness,
            playfulness: validatedBaby.playfulness,
            energy: validatedBaby.energy,
            loyalty: validatedBaby.loyalty,
            curiosity: validatedBaby.curiosity
          }
        });
        
        newBabies.push(validatedBaby);
      }

      // Step 6: Insert the babies into the database
      const { error: insertBabiesError } = await supabase
        .from("litter_babies")
        .insert(newBabies);

      if (insertBabiesError) {
        console.error("❌ Failed to insert babies:", insertBabiesError);
        throw insertBabiesError;
      }

      console.log("✅ Successfully inserted", newBabies.length, "babies into database");

      // Step 7: Update breeding pair to be born but NOT weaned yet - 2 weeks to wean
      const weanDate = new Date();
      weanDate.setDate(weanDate.getDate() + 14); // 2 weeks from now

      const { error: updatePairError } = await supabase
        .from("breeding_pairs")
        .update({
          is_born: true,
          is_weaned: false, // NOT weaned yet - needs 2 weeks
          birth_date: new Date().toISOString(),
          wean_date: weanDate.toISOString(), // 2 weeks from now
          litter_size: litterSize // Make sure litter size is recorded
        })
        .eq("id", breedingPairId);

      if (updatePairError) {
        console.error("❌ Failed to update breeding pair:", updatePairError);
        throw updatePairError;
      }

      console.log("🎉 Accelerate Conception completed successfully with BOUNDED stats and breed variety!");

      toast({
        title: "🚀 Conception Accelerated!",
        description: `Success! Generated ${litterSize} babies instantly with proper stat boundaries and breed variety. Now weaning for 2 weeks. 50 PD deducted.`,
        duration: 8000,
      });

      onUpdate();
    } catch (error: any) {
      console.error("❌ Error accelerating conception:", error);
      toast({
        title: "Acceleration Failed",
        description: error.message || "Failed to accelerate conception",
        variant: "destructive",
      });
    } finally {
      setAccelerating(prev => ({ ...prev, [breedingPairId]: false }));
    }
  };

  const handleAccelerateWeaning = async (breedingPairId: string) => {
    if (!user) return;

    setAccelerating(prev => ({ ...prev, [breedingPairId]: true }));

    try {
      console.log("⏰ Accelerating weaning for pair:", breedingPairId);

      // Just update the wean date to now
      const { error: updateError } = await supabase
        .from("breeding_pairs")
        .update({
          is_weaned: true,
          wean_date: new Date().toISOString()
        })
        .eq("id", breedingPairId);

      if (updateError) throw updateError;

      toast({
        title: "Weaning Accelerated!",
        description: "The babies are now ready to be collected.",
      });

      onUpdate();
    } catch (error: any) {
      console.error("❌ Error accelerating weaning:", error);
      toast({
        title: "Acceleration Failed",
        description: error.message || "Failed to accelerate weaning",
        variant: "destructive",
      });
    } finally {
      setAccelerating(prev => ({ ...prev, [breedingPairId]: false }));
    }
  };

  const activePairs = breedingPairs.filter(pair => !pair.is_completed);

  if (activePairs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Zap className="w-5 h-5" />
          Acceleration Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activePairs.map((pair) => {
          const now = new Date();
          const birthDate = new Date(pair.birth_date);
          const weanDate = new Date(pair.wean_date);
          const isReadyToBirth = now >= birthDate && !pair.is_born;
          const isReadyToWean = now >= weanDate && pair.is_born && !pair.is_weaned;
          const canAccelerateConception = !pair.is_born && !isReadyToBirth;
          // NO weaning acceleration allowed - must wait 2 weeks
          const canAccelerateWean = false; // Disabled weaning acceleration

          return (
            <div key={pair.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Baby className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Breeding Pair #{pair.id.slice(-8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {!pair.is_born ? "Waiting for conception" : pair.is_born && !pair.is_weaned ? "Weaning (2 weeks required)" : "Ready to collect"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {canAccelerateConception && (
                  <Button
                    onClick={() => handleAccelerateConception(pair.id)}
                    disabled={accelerating[pair.id]}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Coins className="w-4 h-4 mr-1" />
                    {accelerating[pair.id] ? "Accelerating..." : "Accelerate Conception (50 PD)"}
                  </Button>
                )}
                {pair.is_born && !pair.is_weaned && (
                  <div className="text-sm text-gray-600 italic">
                    Weaning cannot be accelerated
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AccelerationItem;
