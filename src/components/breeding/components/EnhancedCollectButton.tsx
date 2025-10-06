
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Baby, Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { useStreamlinedCollection } from "../hooks/useStreamlinedCollection";

interface EnhancedCollectButtonProps {
  breedingPair: any;
  litterBabies: any[];
  onCollected: () => void;
}

const EnhancedCollectButton = ({ breedingPair, litterBabies, onCollected }: EnhancedCollectButtonProps) => {
  const { user } = useAuth();
  const { collectBabies, isCollecting } = useStreamlinedCollection();

  const handleCollect = async () => {
    if (!user || breedingPair.user_id !== user.id) return;

    const success = await collectBabies(breedingPair.id, user.id);
    if (success) {
      onCollected();
    }
  };

  // Verify ownership before showing button
  const isOwner = user && breedingPair.user_id === user.id;

  if (!isOwner) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-bold text-yellow-800">Public View</h3>
            <p className="text-yellow-700">
              You are viewing someone else's litter. Only the owner can collect these babies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-full">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Ready to Collect!
            </h3>
            <p className="text-green-700 font-medium">
              {litterBabies.length} babies are fully weaned and ready to join your collection
            </p>
            <p className="text-green-600 text-sm">
              Parents will be automatically released from breeding
            </p>
          </div>
        </div>
        <Button
          onClick={handleCollect}
          disabled={isCollecting}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          {isCollecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Collecting Babies...
            </>
          ) : (
            <>
              <Baby className="w-5 h-5 mr-3" />
              Collect All Babies
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedCollectButton;
