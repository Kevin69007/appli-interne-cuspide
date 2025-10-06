import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ShelterHeader from "@/components/shelter/ShelterHeader";
import ShelterStats from "@/components/shelter/ShelterStats";
import ShelterControls from "@/components/shelter/ShelterControls";
import ShelterPetGrid from "@/components/shelter/ShelterPetGrid";
import ShelterEmptyState from "@/components/shelter/ShelterEmptyState";
import ShelterLoading from "@/components/shelter/ShelterLoading";
import PetIdSearch from "@/components/shelter/PetIdSearch";
import PetSearchModal from "@/components/shelter/PetSearchModal";
import { usePetSearch } from "@/hooks/usePetSearch";

const Shelter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [shelterPets, setShelterPets] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [shelterLoading, setShelterLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  const { 
    searchedPet, 
    isSearching, 
    searchPetByNumber, 
    clearSearchedPet 
  } = usePetSearch();

  useEffect(() => {
    fetchShelterPets();
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Enhanced real-time subscription with better error handling
  useEffect(() => {
    console.log("🔄 Setting up enhanced real-time subscription for shelter pets");
    
    const channel = supabase
      .channel('shelter-pets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shelter_pets'
        },
        (payload) => {
          console.log("📡 Real-time shelter pets change:", payload);
          console.log("📡 Change type:", payload.eventType);
          console.log("📡 New record:", payload.new);
          console.log("📡 Old record:", payload.old);
          
          // Refresh immediately on any change
          fetchShelterPets();
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
      });

    return () => {
      console.log("🔄 Cleaning up enhanced real-time subscription");
      supabase.removeChannel(channel);
    };
  }, []);

  // Listen for global shelter updates
  useEffect(() => {
    const handleShelterUpdate = () => {
      console.log("🔄 Received shelter update event - refreshing data");
      setLastRefresh(Date.now());
      fetchShelterPets();
    };

    window.addEventListener('shelter-update', handleShelterUpdate);
    return () => {
      window.removeEventListener('shelter-update', handleShelterUpdate);
    };
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("paw_dollars, paw_points")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  const fetchShelterPets = async () => {
    setShelterLoading(true);
    
    try {
      console.log("🏠 Fetching shelter pets - refresh:", new Date().toISOString());
      
      const { data: shelterData, error: shelterError } = await supabase
        .from("shelter_pets")
        .select("*")
        .eq("is_available", true)
        .order("listed_at", { ascending: false });

      if (shelterError) {
        console.error("❌ Error fetching shelter pets:", shelterError);
        throw shelterError;
      }

      console.log("✅ Shelter pets loaded:", shelterData?.length || 0, "pets available");
      console.log("🏠 Shelter pets data:", shelterData);

      setShelterPets(shelterData || []);
    } catch (error: any) {
      console.error("❌ Error in fetchShelterPets:", error);
      setShelterPets([]);
    } finally {
      setShelterLoading(false);
    }
  };

  const handleAdoption = () => {
    console.log("🏠 Pet adopted, refreshing shelter data");
    setLastRefresh(Date.now());
    fetchShelterPets();
    if (user) {
      fetchProfile();
    }
  };

  const forceRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    setLastRefresh(Date.now());
    fetchShelterPets();
    if (user) {
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <ProfileLayout>
        <div className="loading-container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading shelter...</p>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="space-y-6">
        <ShelterHeader profile={profile} user={user} />

        <div className="flex justify-between items-center gap-4">
          <ShelterStats petCount={shelterPets.length} />
          
          <PetIdSearch 
            onSearchPet={searchPetByNumber}
            isSearching={isSearching}
          />
          
          <ShelterControls 
            lastRefresh={lastRefresh}
            shelterLoading={shelterLoading}
            onRefresh={forceRefresh}
          />
        </div>

        {shelterLoading ? (
          <ShelterLoading />
        ) : shelterPets.length > 0 ? (
          <ShelterPetGrid pets={shelterPets} onAdopt={handleAdoption} />
        ) : (
          <ShelterEmptyState />
        )}
      </div>

      <PetSearchModal
        pet={searchedPet}
        isOpen={!!searchedPet}
        onClose={clearSearchedPet}
        onUpdate={() => {
          // Refresh shelter data when pet is updated
          fetchShelterPets();
          if (user) {
            fetchProfile();
          }
        }}
      />
    </ProfileLayout>
  );
};

export default Shelter;
