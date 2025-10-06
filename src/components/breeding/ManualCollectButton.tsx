
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Baby, Loader2, AlertTriangle } from "lucide-react";
import { useStreamlinedCollection } from "./hooks/useStreamlinedCollection";

interface ManualCollectButtonProps {
  breedingPair: any;
  onCollected: () => void;
}

const ManualCollectButton = ({ breedingPair, onCollected }: ManualCollectButtonProps) => {
  const { user } = useAuth();
  const { collectBabies, isCollecting } = useStreamlinedCollection();

  const handleCollect = async () => {
    if (!user || breedingPair.user_id !== user.id) return;

    console.log("🍼 Manual collect button clicked for litter:", breedingPair.litter_number);
    const success = await collectBabies(breedingPair.id, user.id);
    if (success) {
      onCollected();
    }
  };

  // Check if collection is needed
  const now = new Date();
  const weanDate = new Date(breedingPair.wean_date);
  const isPastWeanDate = now >= weanDate;
  
  // More permissive conditions for collection
  const needsCollection = breedingPair.is_born && (breedingPair.is_weaned || isPastWeanDate) && !breedingPair.is_completed;

  console.log("🔍 Collection check for litter", breedingPair.litter_number, {
    is_born: breedingPair.is_born,
    is_weaned: breedingPair.is_weaned,
    isPastWeanDate,
    is_completed: breedingPair.is_completed,
    needsCollection,
    wean_date: breedingPair.wean_date
  });

  if (!needsCollection) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-green-800">Ready for Collection</h3>
      </div>
      <p className="text-sm text-green-700 mb-3">
        This litter is fully weaned and ready to be transferred to your pet collection.
      </p>
      <Button
        onClick={handleCollect}
        disabled={isCollecting}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isCollecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Collecting Babies...
          </>
        ) : (
          <>
            <Baby className="w-4 h-4 mr-2" />
            Collect Babies Now
          </>
        )}
      </Button>
    </div>
  );
};

export default ManualCollectButton;
