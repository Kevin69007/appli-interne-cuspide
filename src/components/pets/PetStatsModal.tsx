
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import OddStatDisplay from "@/components/OddStatDisplay";

interface PetStatsModalProps {
  pet: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  isOwnProfile?: boolean;
}

const PetStatsModal = ({ pet, isOpen, onClose, onUpdate, isOwnProfile = false }: PetStatsModalProps) => {
  // Capitalize pet name properly
  const capitalizedPetName = pet.pet_name
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const getStatColor = (value: number) => {
    const percentage = ((value - 0) / (100 - 0)) * 100;
    if (percentage >= 60) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-pink-800">{capitalizedPetName}'s Stats</DialogTitle>
        </DialogHeader>
        <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
          <CardContent className="p-4">
            <OddStatDisplay pet={pet} getStatColor={getStatColor} />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PetStatsModal;
