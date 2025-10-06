
import PetStatsModal from "./PetStatsModal";
import PetProfileModal from "./PetProfileModal";

interface PetModalsManagerProps {
  modalPet: any;
  statsModalPet: any;
  profileModalPet: any;
  onCloseModal: () => void;
  onCloseStatsModal: () => void;
  onCloseProfileModal: () => void;
  onUpdate: () => void;
  isOwnProfile?: boolean;
}

const PetModalsManager = ({
  modalPet,
  statsModalPet,
  profileModalPet,
  onCloseModal,
  onCloseStatsModal,
  onCloseProfileModal,
  onUpdate,
  isOwnProfile = false
}: PetModalsManagerProps) => {
  return (
    <>
      {/* Pet Stats Modal */}
      {statsModalPet && (
        <PetStatsModal
          pet={statsModalPet}
          isOpen={!!statsModalPet}
          onClose={onCloseStatsModal}
          onUpdate={onUpdate}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* Pet Profile Modal */}
      {profileModalPet && (
        <PetProfileModal
          pet={profileModalPet}
          isOpen={!!profileModalPet}
          onClose={onCloseProfileModal}
          onUpdate={onUpdate}
          isOwnProfile={isOwnProfile}
        />
      )}
    </>
  );
};

export default PetModalsManager;
