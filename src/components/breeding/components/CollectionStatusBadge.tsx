
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface CollectionStatusBadgeProps {
  breedingPair: any;
  litterBabies: any[];
  isReadyToCollect: boolean;
}

const CollectionStatusBadge = ({ breedingPair, litterBabies, isReadyToCollect }: CollectionStatusBadgeProps) => {
  // Calculate time-based status
  const now = new Date();
  const weanDate = new Date(breedingPair.wean_date);
  const isPastWeanDate = now >= weanDate;
  
  if (breedingPair.is_completed) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
        <CheckCircle2 className="w-4 h-4" />
        Collection Complete
      </div>
    );
  }

  if (!breedingPair.is_born) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
        <Clock className="w-4 h-4" />
        Babies Not Born Yet
      </div>
    );
  }

  if (litterBabies.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
        <AlertCircle className="w-4 h-4" />
        No Babies Found
      </div>
    );
  }

  if (isReadyToCollect) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        Ready to Collect!
      </div>
    );
  }

  if (!isPastWeanDate) {
    const timeLeft = Math.ceil((weanDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
        <Clock className="w-4 h-4" />
        Weaning ({timeLeft} days left)
      </div>
    );
  }

  // Fallback - should be ready but something's wrong
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
      <AlertCircle className="w-4 h-4" />
      Check Status
    </div>
  );
};

export default CollectionStatusBadge;
