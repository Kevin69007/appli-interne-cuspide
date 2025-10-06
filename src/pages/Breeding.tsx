
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProfileLayout from "@/components/profile/ProfileLayout";
import BreedingInterface from "@/components/breeding/BreedingInterface";
import LitterLicensePurchase from "@/components/breeding/LitterLicensePurchase";
import LitterLicenseSeller from "@/components/breeding/LitterLicenseSeller";
import BreedingHeader from "@/components/breeding/BreedingHeader";
import NurseryTab from "@/components/breeding/components/NurseryTab";
import CompactLitterCard from "@/components/breeding/components/CompactLitterCard";
import DetailedLitterModal from "@/components/breeding/components/DetailedLitterModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Baby } from "lucide-react";
import { useBreedingData } from "@/components/breeding/hooks/useBreedingData";
import { useBreedingActions } from "@/components/breeding/hooks/useBreedingActions";
import { useToast } from "@/hooks/use-toast";

const Breeding = () => {
  const [searchParams] = useSearchParams();
  const {
    user,
    loading,
    breedingPairs,
    userLicenseCount,
    dataLoading,
    fetchData
  } = useBreedingData();
  
  const { generateBabies } = useBreedingActions();
  const { toast } = useToast();

  const urlTab = searchParams.get('tab');
  const [currentTab, setCurrentTab] = useState(urlTab || "start-breeding");
  const [selectedLitter, setSelectedLitter] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (urlTab) {
      setCurrentTab(urlTab);
    }
  }, [urlTab]);

  const handleViewLitterDetails = (breedingPair: any) => {
    setSelectedLitter(breedingPair);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedLitter(null);
  };

  if (loading || dataLoading) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading breeding center...</p>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  if (!user) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-pink-800 mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Please log in to access the breeding center.</p>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  const activePairs = breedingPairs.filter(pair => !pair.is_completed);
  const completedPairs = breedingPairs.filter(pair => pair.is_completed);

  const renderTabContent = () => {
    switch (currentTab) {
      case "start-breeding":
        return (
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
              <CardHeader>
                <CardTitle className="text-pink-800">Start New Breeding</CardTitle>
              </CardHeader>
              <CardContent>
                <BreedingInterface />
              </CardContent>
            </Card>
          </div>
        );

      case "active-pairs":
        return activePairs.length > 0 ? (
          <div className="space-y-6">
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pink-800 mb-2">Active Litters</h2>
                <p className="text-muted-foreground">Click on any litter card to view details and collect babies when ready.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activePairs.map((pair) => (
                  <CompactLitterCard
                    key={pair.id}
                    breedingPair={pair}
                    onViewDetails={() => handleViewLitterDetails(pair)}
                    onUpdate={fetchData}
                    isCompleted={false}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 text-center p-8">
            <Clock className="w-12 h-12 text-pink-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-pink-800 mb-2">No Active Breeding Pairs</h3>
            <p className="text-muted-foreground">
              Start your first breeding pair in the "Start Breeding" tab!
            </p>
          </Card>
        );

      case "completed":
        return completedPairs.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-pink-800 mb-2">Completed Litters</h2>
              <p className="text-muted-foreground">View your past breeding successes and the babies you've collected.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {completedPairs.map((pair) => (
                <CompactLitterCard
                  key={pair.id}
                  breedingPair={pair}
                  onViewDetails={() => handleViewLitterDetails(pair)}
                  onUpdate={fetchData}
                  isCompleted={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 text-center p-8">
            <Baby className="w-12 h-12 text-pink-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-pink-800 mb-2">No Past Litters Yet</h3>
            <p className="text-muted-foreground">
              Completed breeding pairs will appear here once babies are collected.
            </p>
          </Card>
        );

      case "nursery":
        return <NurseryTab />;

      case "purchase-licenses":
        return (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LitterLicensePurchase onUpdate={fetchData} userLicenseCount={userLicenseCount} />
              <LitterLicenseSeller />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProfileLayout>
      <BreedingHeader 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activePairsCount={activePairs.length}
        completedPairsCount={completedPairs.length}
      />
      
      {renderTabContent()}

      {/* Detailed Litter Modal */}
      {selectedLitter && (
        <DetailedLitterModal
          breedingPair={selectedLitter}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onUpdate={fetchData}
          isCompleted={selectedLitter.is_completed}
        />
      )}
    </ProfileLayout>
  );
};

export default Breeding;
