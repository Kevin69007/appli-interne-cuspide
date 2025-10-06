
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePetTransfer } from "@/hooks/usePetTransfer";
import { capitalizePetName } from "@/utils/petHelpers";
import { usePetPurchaseData } from "./purchase/usePetPurchaseData";
import PetPurchaseInfo from "./purchase/PetPurchaseInfo";
import PurchaseValidationStatus from "./purchase/PurchaseValidationStatus";
import SellerInfo from "./purchase/SellerInfo";
import PriceDisplay from "./purchase/PriceDisplay";
import BalanceCheck from "./purchase/BalanceCheck";
import PurchaseActions from "./purchase/PurchaseActions";

interface PetPurchaseModalProps {
  pet: any;
  petSaleInfo: any;
  sellerProfile: any;
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

const PetPurchaseModal = ({
  pet,
  petSaleInfo,
  sellerProfile,
  isOpen,
  onClose,
  onPurchaseComplete
}: PetPurchaseModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { transferPetOwnership, isTransferring } = usePetTransfer();
  
  const {
    userProfile,
    isValidating,
    validationError,
    validateSale
  } = usePetPurchaseData(pet, petSaleInfo, isOpen);

  const capitalizedPetName = capitalizePetName(pet.pet_name);
  const price = petSaleInfo?.price_nd || 0;

  const handlePurchase = async () => {
    if (!user || !petSaleInfo || !userProfile || validationError) {
      console.error('❌ Cannot proceed with purchase - missing data or validation error');
      return;
    }

    console.log('🛒 Purchase initiated:', {
      petId: pet.id,
      petName: pet.pet_name,
      sellerId: petSaleInfo.seller_id,
      buyerId: user.id,
      price: price,
      userBalance: userProfile.paw_dollars
    });

    if (userProfile.paw_dollars < price) {
      toast({
        title: "Insufficient Funds",
        description: `You need ${price} Paw Dollars but only have ${userProfile.paw_dollars}.`,
        variant: "destructive",
      });
      return;
    }

    const result = await transferPetOwnership(
      pet.id,
      petSaleInfo.seller_id,
      price
    );

    console.log('🛒 Purchase result:', result);

    if (result.success) {
      onPurchaseComplete();
      onClose();
    } else {
      setTimeout(() => {
        validateSale();
      }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <DollarSign className="w-5 h-5" />
            Purchase Pet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PetPurchaseInfo pet={pet} capitalizedPetName={capitalizedPetName} />
          
          <PurchaseValidationStatus 
            isValidating={isValidating} 
            validationError={validationError} 
          />

          {!validationError && (
            <>
              <SellerInfo sellerProfile={sellerProfile} />
              <PriceDisplay price={price} />
              {userProfile && (
                <BalanceCheck userBalance={userProfile.paw_dollars} price={price} />
              )}
            </>
          )}

          <PurchaseActions
            validationError={validationError}
            isValidating={isValidating}
            isTransferring={isTransferring}
            userProfile={userProfile}
            price={price}
            onClose={onClose}
            onPurchase={handlePurchase}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PetPurchaseModal;
