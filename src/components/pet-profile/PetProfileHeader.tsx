import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PetImage from "./PetImage";
import PetBasicInfo from "./PetBasicInfo";
import PetMetadata from "./PetMetadata";
import PetDescription from "./PetDescription";
import PetAboutSection from "./PetAboutSection";
import PetProfileEditor from "./PetProfileEditor";
import PetOrderSetting from "./PetOrderSetting";

interface PetProfileHeaderProps {
  pet: any;
  parents?: { mother: any; father: any };
  isOwnProfile?: boolean;
  onUpdate?: () => void;
  isForumModal?: boolean;
}

const PetProfileHeader = ({ 
  pet, 
  parents = { mother: null, father: null }, 
  isOwnProfile = false, 
  onUpdate,
  isForumModal = false
}: PetProfileHeaderProps) => {
  console.log('🐾 PetProfileHeader - pet breed:', pet.breed, 'isForumModal:', isForumModal);
  console.log('🐾 PetProfileHeader - isOwnProfile:', isOwnProfile, 'pet.pet_name:', pet.pet_name);
  
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-800 flex items-center gap-2">
          🐾 
          {isOwnProfile && !isForumModal ? (
            <>
              {console.log('🐾 Rendering PetProfileEditor for own profile')}
              <PetProfileEditor pet={pet} onUpdate={onUpdate || (() => {})} />
            </>
          ) : (
            <>
              {console.log('🐾 Rendering static pet name (not own profile or is forum modal)')}
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-pink-800">{pet.pet_name}</h2>
                <Badge variant="outline" className="text-xs">
                  #{pet.pet_number || 1}
                </Badge>
              </div>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <PetImage
          pet={pet}
          petName={pet.pet_name}
          breed={pet.breed}
          petType={pet.pets?.name}
          isForumModal={isForumModal}
        />
        
        <PetBasicInfo pet={pet} />
        
        <PetMetadata 
          pet={pet} 
          parents={parents} 
          isForumModal={isForumModal}
        />
        
        <PetDescription 
          description={pet.description}
          petId={pet.id}
          isOwnProfile={isOwnProfile} 
          onUpdate={onUpdate}
        />

        <PetAboutSection
          aboutSection={pet.about_section}
          petId={pet.id}
          petName={pet.pet_name}
          isOwnProfile={isOwnProfile}
          onUpdate={onUpdate}
        />

        {isOwnProfile && !isForumModal && (
          <PetOrderSetting 
            pet={pet}
            onUpdate={onUpdate || (() => {})}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PetProfileHeader;
