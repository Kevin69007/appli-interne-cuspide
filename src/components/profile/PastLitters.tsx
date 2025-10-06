
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Calendar, Baby, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import LitterBabiesGrid from "@/components/breeding/LitterBabiesGrid";
import BabyProfileModal from "@/components/breeding/BabyProfileModal";

interface PastLitter {
  id: string;
  created_at: string;
  litter_size: number;
  birth_date: string;
  wean_date: string;
  litter_number: number;
  parent1: {
    id: string;
    pet_name: string;
    pets: {
      name: string;
    };
  };
  parent2: {
    id: string;
    pet_name: string;
    pets: {
      name: string;
    };
  };
  babies: Array<{
    id: string;
    pet_name: string;
    breed: string;
    gender: string;
    friendliness: number;
    playfulness: number;
    energy: number;
    loyalty: number;
    curiosity: number;
    birthday: string;
    pet_number?: number; // Make pet_number optional
  }>;
}

const PastLitters = () => {
  const { user } = useAuth();
  const [pastLitters, setPastLitters] = useState<PastLitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBaby, setSelectedBaby] = useState<any>(null);
  const [isBabyProfileModalOpen, setIsBabyProfileModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPastLitters();
    }
  }, [user]);

  const fetchPastLitters = async () => {
    if (!user) return;

    try {
      console.log("🔍 Fetching past litters for user:", user.id);

      // Get all completed breeding pairs
      const { data: completedPairs, error: pairsError } = await supabase
        .from("breeding_pairs")
        .select(`
          id,
          created_at,
          litter_size,
          litter_number,
          birth_date,
          wean_date,
          parent1_id,
          parent2_id,
          parent1:user_pets!parent1_id (
            id,
            pet_name,
            pets (name)
          ),
          parent2:user_pets!parent2_id (
            id,
            pet_name,
            pets (name)
          )
        `)
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("wean_date", { ascending: false });

      if (pairsError) {
        console.error("❌ Error fetching completed pairs:", pairsError);
        throw pairsError;
      }

      console.log("✅ Found", completedPairs?.length || 0, "completed breeding pairs");

      // For each completed pair, get babies from both sources
      const littersWithBabies = await Promise.all(
        (completedPairs || []).map(async (pair) => {
          console.log(`🔍 Fetching babies for completed litter #${pair.litter_number} (pair: ${pair.id})`);
          
          // First, get collected babies from user_pets (these have pet_number)
          const { data: collectedBabies, error: collectedError } = await supabase
            .from("user_pets")
            .select("id, pet_name, breed, gender, friendliness, playfulness, energy, loyalty, curiosity, birthday, pet_number")
            .eq("user_id", user.id)
            .or(`parent1_id.eq.${pair.parent1_id},parent2_id.eq.${pair.parent2_id}`)
            .not("parent1_id", "is", null)
            .not("parent2_id", "is", null);

          if (collectedError) {
            console.error("❌ Error fetching collected babies:", collectedError);
          }

          // Then, get any remaining babies from litter_babies (these don't have pet_number)
          const { data: litterBabies, error: litterError } = await supabase
            .from("litter_babies")
            .select("id, pet_name, breed, gender, friendliness, playfulness, energy, loyalty, curiosity, birthday")
            .eq("breeding_pair_id", pair.id);

          if (litterError) {
            console.error("❌ Error fetching litter babies:", litterError);
          }

          console.log(`📊 Litter #${pair.litter_number} - Found ${collectedBabies?.length || 0} collected babies and ${litterBabies?.length || 0} litter babies`);

          // Combine babies from both sources
          let allBabies: any[] = [];
          
          // Add collected babies (with pet_number)
          if (collectedBabies) {
            allBabies = [...collectedBabies];
            console.log(`✅ Added ${collectedBabies.length} collected babies with pet numbers`);
          }
          
          // Add litter babies that don't exist in collected babies (without pet_number)
          if (litterBabies) {
            const newLitterBabies = litterBabies.filter(litterBaby => 
              !allBabies.some(collectedBaby => 
                collectedBaby.pet_name === litterBaby.pet_name && 
                collectedBaby.breed === litterBaby.breed
              )
            );
            
            // Add litter babies without pet_number (it will be undefined)
            allBabies = [...allBabies, ...newLitterBabies];
            console.log(`✅ Added ${newLitterBabies.length} additional litter babies`);
          }

          console.log(`✅ Total babies for litter #${pair.litter_number}: ${allBabies.length}`);
          
          // Clean up baby names
          const cleanedBabies = allBabies.map(baby => ({
            ...baby,
            pet_name: baby.pet_name && baby.pet_name.includes('_') ? baby.pet_name.split('_')[0] : baby.pet_name || 'Unnamed'
          }));
          
          return { ...pair, babies: cleanedBabies };
        })
      );

      setPastLitters(littersWithBabies);
      console.log("✅ Set past litters with babies:", littersWithBabies.map(l => 
        `Litter #${l.litter_number}: ${l.babies.length} babies`
      ).join(", "));
    } catch (error) {
      console.error("❌ Error fetching past litters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBabyNameClick = (baby: any) => {
    setSelectedBaby(baby);
    setIsBabyProfileModalOpen(true);
  };

  const handleCloseBabyProfileModal = () => {
    setIsBabyProfileModalOpen(false);
    setSelectedBaby(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading past litters...</div>;
  }

  if (pastLitters.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="w-12 h-12 text-pink-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-pink-800 mb-2">No Past Litters</h3>
        <p className="text-muted-foreground">
          You haven't completed any breeding yet. Visit the breeding center to start!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-pink-800">Past Litters</h2>
        
        <div className="grid grid-cols-1 gap-6">
          {pastLitters.map((litter) => (
            <Card key={litter.id} className="bg-white/90 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Litter #{litter.litter_number} - {litter.parent1?.pet_name} × {litter.parent2?.pet_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Completed {formatDistanceToNow(new Date(litter.wean_date))} ago
                  </span>
                  <span className="flex items-center gap-1">
                    <Baby className="w-4 h-4" />
                    {litter.babies.length} babies
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Parent Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center">
                        <span className="text-pink-600 font-bold">
                          {litter.parent1?.pets?.name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{litter.parent1?.pet_name}</p>
                        <p className="text-sm text-muted-foreground">{litter.parent1?.pets?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center">
                        <span className="text-pink-600 font-bold">
                          {litter.parent2?.pets?.name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{litter.parent2?.pet_name}</p>
                        <p className="text-sm text-muted-foreground">{litter.parent2?.pets?.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Breeding Timeline */}
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <span className="font-medium">Started:</span> {new Date(litter.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Born:</span> {new Date(litter.birth_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Collected:</span> {new Date(litter.wean_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Babies Display */}
                  <div>
                    <h4 className="font-medium text-pink-800 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Babies from Litter #{litter.litter_number}:
                    </h4>
                    {litter.babies.length > 0 ? (
                      <LitterBabiesGrid
                        babies={litter.babies}
                        onAdoptBaby={() => {}}
                        userCanAdopt={false}
                        onBabyNameClick={handleBabyNameClick}
                        isPublicView={false}
                      />
                    ) : (
                      <div className="text-center py-4 text-gray-500 italic bg-gray-50 rounded-lg">
                        <Baby className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No babies found for Litter #{litter.litter_number}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Babies may have been collected or transferred
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Baby Profile Modal */}
      {selectedBaby && (
        <BabyProfileModal
          baby={selectedBaby}
          isOpen={isBabyProfileModalOpen}
          onClose={handleCloseBabyProfileModal}
          onUpdate={fetchPastLitters}
        />
      )}
    </>
  );
};

export default PastLitters;
