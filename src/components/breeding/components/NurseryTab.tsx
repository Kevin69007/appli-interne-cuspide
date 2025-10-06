
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NurseryCard from "./NurseryCard";
import DetailedLitterModal from "./DetailedLitterModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Heart, Sparkles } from "lucide-react";

const NurseryTab = () => {
  const { user } = useAuth();
  const [publicBreedingPairs, setPublicBreedingPairs] = useState<any[]>([]);
  const [selectedLitter, setSelectedLitter] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPublicBreedingPairs = async () => {
    try {
      // Fetch all active breeding pairs that are visible in nursery
      const { data: breedingPairs, error } = await supabase
        .from("breeding_pairs")
        .select("*")
        .eq("is_born", true)
        .eq("is_completed", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching breeding pairs:", error);
        return;
      }

      if (!breedingPairs || breedingPairs.length === 0) {
        console.log("🍼 No breeding pairs found");
        setPublicBreedingPairs([]);
        return;
      }

      // Get all unique user IDs
      const userIds = [...new Set(breedingPairs.map(pair => pair.user_id))];
      
      // Fetch profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, nursery_visible, is_banned")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // Create a map of user profiles for easy lookup
      const profilesMap = new Map();
      profiles?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Filter out banned users and users who have disabled nursery visibility
      const visiblePairs = breedingPairs.filter(pair => {
        const profile = profilesMap.get(pair.user_id);
        return profile && 
               !profile.is_banned && 
               profile.nursery_visible !== false;
      });

      // Add profile data to pairs
      const pairsWithProfiles = visiblePairs.map(pair => ({
        ...pair,
        profiles: profilesMap.get(pair.user_id)
      }));

      console.log("🍼 Fetched nursery pairs:", pairsWithProfiles.length);
      setPublicBreedingPairs(pairsWithProfiles);
    } catch (error) {
      console.error("Error in fetchPublicBreedingPairs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLitterDetails = (breedingPair: any) => {
    console.log("🔍 Opening litter details for pair:", breedingPair.id);
    setSelectedLitter(breedingPair);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedLitter(null);
  };

  useEffect(() => {
    fetchPublicBreedingPairs();
    
    // Set up real-time subscription for breeding pairs updates
    const channel = supabase
      .channel('nursery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'breeding_pairs'
        },
        () => {
          console.log("🔄 Breeding pairs updated, refreshing nursery");
          fetchPublicBreedingPairs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-lg text-pink-600">Loading nursery...</p>
        </div>
      </div>
    );
  }

  if (publicBreedingPairs.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200 text-center p-8">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Baby className="w-16 h-16 text-pink-300" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-pink-800 mb-2">Nursery is Empty</h3>
        <p className="text-muted-foreground text-lg">
          No litters are currently available for viewing. Check back later to see adorable babies from the community!
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-pink-600">
          <Heart className="w-4 h-4 fill-current" />
          <span className="text-sm">New litters appear here when born</span>
          <Heart className="w-4 h-4 fill-current" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Baby className="w-8 h-8 text-pink-600" />
            <h2 className="text-3xl font-bold text-pink-800">Community Nursery</h2>
            <Baby className="w-8 h-8 text-pink-600" />
          </div>
          <p className="text-muted-foreground text-lg">
            Discover adorable litters from breeders around the community! 
            <span className="block mt-1 text-sm">({publicBreedingPairs.length} active litters)</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicBreedingPairs.map((pair) => (
            <NurseryCard
              key={pair.id}
              breedingPair={pair}
              onViewDetails={() => handleViewLitterDetails(pair)}
            />
          ))}
        </div>
      </div>

      {/* Detailed Litter Modal */}
      {selectedLitter && (
        <DetailedLitterModal
          breedingPair={selectedLitter}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onUpdate={fetchPublicBreedingPairs}
          isCompleted={selectedLitter.is_completed}
          isPublicNurseryView={true}
        />
      )}
    </>
  );
};

export default NurseryTab;
