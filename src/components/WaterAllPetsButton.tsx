
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Droplets, Crown } from "lucide-react";
import { usePawClubSubscription } from "@/hooks/usePawClubSubscription";
import { usePetActions } from "@/hooks/usePetActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WaterAllPetsButtonProps {
  onWaterComplete: () => void;
}

const WaterAllPetsButton = ({ onWaterComplete }: WaterAllPetsButtonProps) => {
  const { user } = useAuth();
  const { isPawClubMember, createCheckout, loading: subscriptionLoading } = usePawClubSubscription();
  const { bulkWaterPets, isBulkWatering } = usePetActions();

  const handleWaterAll = async () => {
    if (!user || !isPawClubMember) return;

    const result = await bulkWaterPets(user.id, true); // isOwnPets = true
    
    if (result.success && result.wateredCount && result.wateredCount > 0) {
      onWaterComplete();
      window.dispatchEvent(new CustomEvent('pets-watered-all'));
    }
  };

  const isWatering = user ? isBulkWatering(user.id) : false;

  if (subscriptionLoading) {
    return (
      <Button 
        variant="outline" 
        className="border-blue-300 text-blue-700 hover:bg-blue-50"
        disabled
      >
        <Droplets className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!isPawClubMember) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Droplets className="w-4 h-4 mr-2" />
            Water All Pets
            <Crown className="w-4 h-4 ml-2" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              PawClub Premium Feature
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>The "Water All Pets" button is a premium feature exclusive to PawClub members!</p>
              <p>PawClub membership includes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Feed All & Water All buttons for convenience</li>
                <li>10 bonus Paw Dollars daily</li>
                <li>20,000 XP daily limit (vs 10,000)</li>
                <li>Exclusive PawClub badge</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={createCheckout} className="bg-purple-600 hover:bg-purple-700">
            Subscribe to PawClub - $9.99/month
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button
      onClick={handleWaterAll}
      disabled={isWatering}
      className="bg-blue-600 hover:bg-blue-700"
    >
      <Droplets className="w-4 h-4 mr-2" />
      {isWatering ? "Watering..." : "Water All Pets"}
    </Button>
  );
};

export default WaterAllPetsButton;
