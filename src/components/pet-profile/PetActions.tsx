
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Droplets, Play, ShoppingCart, Settings, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SellToShelterButton from "@/components/SellToShelterButton";
import PetLockToggle from "@/components/pets/PetLockToggle";

interface PetActionsProps {
  pet: any;
  onFeed: (petId: string) => void;
  onWater: (petId: string) => void;
  onPlay: (petId: string) => void;
  onSell?: (pet: any) => void;
  onEditToggle?: () => void;
  onPetUpdate?: () => void;
  isOwnProfile?: boolean;
  isEditing?: boolean;
}

const PetActions = ({
  pet,
  onFeed,
  onWater,
  onPlay,
  onSell,
  onEditToggle,
  onPetUpdate,
  isOwnProfile = true,
  isEditing = false
}: PetActionsProps) => {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, callback: () => void) => {
    setActionLoading(action);
    callback();
    setTimeout(() => setActionLoading(null), 1500);
  };

  if (!isOwnProfile) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pet Lock Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium">Pet Lock</h4>
          <p className="text-sm text-muted-foreground">
            Protect your pet with a PIN to prevent unauthorized sales
          </p>
        </div>
        <PetLockToggle 
          pet={pet} 
          onToggle={() => onPetUpdate?.()} 
        />
      </div>

      {/* Care Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('feed', () => onFeed(pet.id))}
          disabled={actionLoading === 'feed'}
          className="flex flex-col items-center gap-1 h-auto py-3"
        >
          <Heart className="w-4 h-4" />
          <span className="text-xs">
            {actionLoading === 'feed' ? 'Feeding...' : `Feed (${pet.hunger}%)`}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('water', () => onWater(pet.id))}
          disabled={actionLoading === 'water'}
          className="flex flex-col items-center gap-1 h-auto py-3"
        >
          <Droplets className="w-4 h-4" />
          <span className="text-xs">
            {actionLoading === 'water' ? 'Watering...' : `Water (${pet.water}%)`}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('play', () => onPlay(pet.id))}
          disabled={actionLoading === 'play'}
          className="flex flex-col items-center gap-1 h-auto py-3"
        >
          <Play className="w-4 h-4" />
          <span className="text-xs">
            {actionLoading === 'play' ? 'Playing...' : 'Play'}
          </span>
        </Button>
      </div>

      {/* Management Actions */}
      <div className="flex gap-2">
        {onSell && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSell(pet)}
            className="flex-1"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Sell Pet
          </Button>
        )}

        <SellToShelterButton
          pet={pet}
          onSold={() => onPetUpdate?.()}
        />

        {onEditToggle && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditToggle}
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PetActions;
