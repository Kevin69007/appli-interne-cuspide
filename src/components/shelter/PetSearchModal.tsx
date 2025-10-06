
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PetProfileHeader from "@/components/pet-profile/PetProfileHeader";
import PetStatsCard from "@/components/pet-profile/PetStatsCard";
import ShelterPetActions from "@/components/shelter/ShelterPetActions";
import ProfileLink from "@/components/forum/ProfileLink";
import { calculateAge } from "@/utils/timeHelpers";

interface PetSearchModalProps {
  pet: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const PetSearchModal = ({ pet, isOpen, onClose, onUpdate }: PetSearchModalProps) => {
  if (!pet) return null;

  console.log('🔍 PetSearchModal rendering for pet:', pet.pet_name, 'source:', pet.source);

  // Create mock parents data structure (search doesn't include parent info)
  const parents = { mother: null, father: null };

  // Calculate age for description
  const ageInDays = pet.birthday ? calculateAge(pet.birthday) : 0;
  const months = Math.floor(ageInDays / 30);
  const days = ageInDays % 30;

  // Format dates for description
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric'
    });
  };

  // Get owner's username and determine pet status
  const ownerUsername = pet.profiles?.username || "Unknown User";
  const isShelterPet = pet.source === 'shelter_pets';
  const isUserPet = pet.source === 'user_pets';
  const isAvailableForAdoption = isShelterPet && pet.is_available;

  // Create enhanced pet object with auto-generated description
  const enhancedPet = {
    ...pet,
    description: isShelterPet
      ? `${pet.pet_name} is a ${pet.gender} ${pet.breed} ${pet.is_available ? 'looking for a loving home' : 'that was previously in the shelter'}! ${pet.pet_name} was born ${pet.birthday ? formatDate(pet.birthday) : 'on an unknown date'} and is ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old. ${pet.is_available ? 'This adorable pet is available for adoption at the shelter.' : 'This pet is no longer available for adoption.'}`
      : `${pet.pet_name} is a ${pet.gender} ${pet.breed} and was born ${pet.birthday ? formatDate(pet.birthday) : 'on an unknown date'}${pet.adopted_at ? ` and was adopted by ${ownerUsername} on ${formatDate(pet.adopted_at)}` : ''}. ${pet.pet_name} is ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old.`
  };

  const handleAdoption = () => {
    console.log('🎉 Pet adopted from search modal, refreshing shelter');
    onUpdate?.();
    onClose();
  };

  // Determine title and status badge
  const getStatusInfo = () => {
    if (isUserPet) {
      return {
        title: `Pet #${pet.pet_number} - ${pet.pet_name}'s Profile`,
        badge: { text: `Owned by ${ownerUsername}`, color: 'bg-blue-100 text-blue-800' }
      };
    } else if (isAvailableForAdoption) {
      return {
        title: `Pet #${pet.pet_number} - ${pet.pet_name}'s Profile`,
        badge: { text: 'Available for Adoption', color: 'bg-pink-100 text-pink-800' }
      };
    } else {
      return {
        title: `Pet #${pet.pet_number} - ${pet.pet_name}'s Profile`,
        badge: { text: 'No Longer Available', color: 'bg-gray-100 text-gray-800' }
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isShelterPet && <span className="text-pink-600">🏠</span>}
            {isUserPet && <span className="text-blue-600">👤</span>}
            {statusInfo.title}
            <span className={`text-sm px-2 py-1 rounded-full ml-2 ${statusInfo.badge.color}`}>
              {statusInfo.badge.text}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PetProfileHeader 
              pet={enhancedPet} 
              parents={parents} 
              isOwnProfile={false}
              onUpdate={onUpdate}
              isForumModal={true}
            />
          </div>
          
          <div className="space-y-6">
            <PetStatsCard 
              pet={pet}
              onUpdate={onUpdate}
            />
            
            {/* Adoption actions for available shelter pets */}
            {isAvailableForAdoption && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h3 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
                  🏠 Shelter Adoption
                </h3>
                <p className="text-sm text-pink-700 mb-4">
                  This pet is available for adoption! Give {pet.pet_name} a loving home.
                </p>
                <ShelterPetActions 
                  pet={pet} 
                  onAdopt={handleAdoption}
                />
              </div>
            )}

            {/* Information for unavailable shelter pets */}
            {isShelterPet && !pet.is_available && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  ℹ️ Pet Status
                </h3>
                <p className="text-sm text-gray-700">
                  This pet was previously available at the shelter but has since been adopted or is no longer available for adoption.
                </p>
              </div>
            )}

            {/* Information for user-owned pets with clickable username */}
            {isUserPet && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  👤 Pet Owner
                </h3>
                <div className="text-sm text-blue-700 flex items-center gap-1">
                  <span>This pet is owned by</span>
                  <ProfileLink 
                    profile={{ username: ownerUsername }}
                    className="font-semibold"
                    showIcon={false}
                  />
                  {pet.adopted_at && (
                    <span>. Adopted on {formatDate(pet.adopted_at)}.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PetSearchModal;
