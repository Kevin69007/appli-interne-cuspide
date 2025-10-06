
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import PinVerificationModal from "./pets/PinVerificationModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useShelterValidation } from "./shelter/ShelterValidation";
import { useShelterSale } from "./shelter/ShelterSaleLogic";

interface SellToShelterButtonProps {
  pet: any;
  onSold: () => void;
}

const SellToShelterButton = ({ pet, onSold }: SellToShelterButtonProps) => {
  const { user } = useAuth();
  const [selling, setSelling] = useState(false);
  const [isBreeding, setIsBreeding] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  
  const { checkBreedingStatus, validateSaleEligibility } = useShelterValidation();
  const { executeShelterSale } = useShelterSale();

  useEffect(() => {
    const fetchBreedingStatus = async () => {
      const breedingStatus = await checkBreedingStatus(pet);
      setIsBreeding(breedingStatus);
    };
    
    fetchBreedingStatus();
  }, [pet.id, pet.pet_name]);

  const handleSellClick = () => {
    if (pet.is_locked) {
      setShowPinVerification(true);
    } else {
      proceedWithSale();
    }
  };

  const handlePinVerified = (pin: string) => {
    setShowPinVerification(false);
    proceedWithSale();
  };

  const proceedWithSale = async () => {
    if (!user) return;

    setSelling(true);
    
    const isValid = await validateSaleEligibility(pet);
    if (!isValid) {
      setSelling(false);
      return;
    }

    const success = await executeShelterSale(pet, user.id);
    
    if (success) {
      onSold();
      window.dispatchEvent(new CustomEvent('shelter-update'));
      window.dispatchEvent(new CustomEvent('pets-update'));
      window.dispatchEvent(new CustomEvent('profile-update'));
    }
    
    setSelling(false);
  };

  if (isBreeding) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Home className="w-4 h-4 mr-2" />
        Currently Breeding
      </Button>
    );
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={selling}>
            <Home className="w-4 h-4 mr-2" />
            {selling ? "Selling..." : "Sell to Shelter"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sell {pet.pet_name} to Shelter?</AlertDialogTitle>
            <AlertDialogDescription>
              You will receive 70 Paw Dollars for {pet.pet_name} (#{pet.pet_number}). The pet will then be available 
              for adoption in the shelter for 100 Paw Dollars. This action cannot be undone.
              {pet.is_locked && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                  This pet is locked and will require PIN verification before sale.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSellClick} disabled={selling}>
              {selling ? "Selling..." : "Sell to Shelter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PinVerificationModal
        isOpen={showPinVerification}
        onClose={() => setShowPinVerification(false)}
        onVerify={handlePinVerified}
        petName={pet.pet_name}
        actionType="sell"
      />
    </>
  );
};

export default SellToShelterButton;
