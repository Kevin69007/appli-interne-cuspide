
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Utensils, Crown } from "lucide-react";
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

interface FeedAllPetsButtonProps {
  onFeedComplete: () => void;
}

const FeedAllPetsButton = ({ onFeedComplete }: FeedAllPetsButtonProps) => {
  const { user } = useAuth();
  const { isPawClubMember, createCheckout, loading: subscriptionLoading } = usePawClubSubscription();
  const { bulkFeedPets, isBulkFeeding } = usePetActions();

  const handleFeedAll = async () => {
    if (!user || !isPawClubMember) return;

    const result = await bulkFeedPets(user.id, true); // isOwnPets = true
    
    if (result.success && result.fedCount && result.fedCount > 0) {
      onFeedComplete();
      window.dispatchEvent(new CustomEvent('pets-fed-all'));
    }
  };

  const isFeeding = user ? isBulkFeeding(user.id) : false;

  if (subscriptionLoading) {
    return (
      <Button 
        variant="outline" 
        className="border-orange-300 text-orange-700 hover:bg-orange-50"
        disabled
      >
        <Utensils className="w-4 h-4 mr-2" />
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
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <Utensils className="w-4 h-4 mr-2" />
            Feed All Pets
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
              <p>The "Feed All Pets" button is a premium feature exclusive to PawClub members!</p>
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
      onClick={handleFeedAll}
      disabled={isFeeding}
      className="bg-orange-600 hover:bg-orange-700"
    >
      <Utensils className="w-4 h-4 mr-2" />
      {isFeeding ? "Feeding..." : "Feed All Pets"}
    </Button>
  );
};

export default FeedAllPetsButton;
