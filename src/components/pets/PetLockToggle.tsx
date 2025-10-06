
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Lock, Unlock } from "lucide-react";
import { usePetLock } from "@/hooks/usePetLock";
import PinSetupModal from "./PinSetupModal";
import PinVerificationModal from "./PinVerificationModal";

interface PetLockToggleProps {
  pet: {
    id: string;
    pet_name: string;
    is_locked?: boolean;
  };
  onToggle: () => void;
  disabled?: boolean;
}

const PetLockToggle = ({ pet, onToggle, disabled = false }: PetLockToggleProps) => {
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const { lockPet, unlockPet, isProcessing } = usePetLock();

  const handleToggleClick = () => {
    if (disabled || isProcessing) return;
    
    console.log('🔐 PetLockToggle - Toggle clicked for pet:', pet.pet_name, 'is_locked:', pet.is_locked);
    
    if (pet.is_locked) {
      // Pet is locked, need PIN to unlock
      setShowPinVerification(true);
    } else {
      // Pet is unlocked, need to set PIN to lock
      setShowPinSetup(true);
    }
  };

  const handleLockPet = async (pin: string) => {
    console.log('🔐 PetLockToggle - Attempting to lock pet with PIN');
    const success = await lockPet(pet.id, pin);
    if (success) {
      console.log('✅ Pet locked successfully');
      onToggle();
      setShowPinSetup(false);
    } else {
      console.log('❌ Failed to lock pet');
    }
  };

  const handleUnlockPet = async (pin: string) => {
    console.log('🔓 PetLockToggle - Attempting to unlock pet with PIN');
    const success = await unlockPet(pet.id, pin);
    if (success) {
      console.log('✅ Pet unlocked successfully');
      onToggle();
      setShowPinVerification(false);
    } else {
      console.log('❌ Failed to unlock pet');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {pet.is_locked ? (
          <Lock className="w-4 h-4 text-red-600" />
        ) : (
          <Unlock className="w-4 h-4 text-green-600" />
        )}
        <span className="text-sm font-medium">
          {pet.is_locked ? "Locked" : "Unlocked"}
        </span>
      </div>
      <Switch
        checked={pet.is_locked || false}
        onCheckedChange={handleToggleClick}
        disabled={disabled || isProcessing}
      />

      {showPinSetup && (
        <PinSetupModal
          isOpen={showPinSetup}
          onClose={() => setShowPinSetup(false)}
          onConfirm={handleLockPet}
          petName={pet.pet_name}
          isLoading={isProcessing}
        />
      )}

      {showPinVerification && (
        <PinVerificationModal
          isOpen={showPinVerification}
          onClose={() => setShowPinVerification(false)}
          onVerify={handleUnlockPet}
          petName={pet.pet_name}
          isLoading={isProcessing}
        />
      )}
    </div>
  );
};

export default PetLockToggle;
