
import { calculateAge } from "@/utils/timeHelpers";

interface PetMetadataProps {
  pet: any;
  parents?: { mother: any; father: any };
  isForumModal?: boolean;
}

const PetMetadata = ({ pet, parents = { mother: null, father: null }, isForumModal = false }: PetMetadataProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric', 
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-2 text-sm text-gray-600">
      {pet.birthday && (
        <div>
          <span className="font-medium">Birthday:</span> {formatDate(pet.birthday)}
        </div>
      )}
      
      {pet.adopted_at && (
        <div>
          <span className="font-medium">Adopted:</span> {formatDate(pet.adopted_at)}
        </div>
      )}
      
      {(parents?.mother || parents?.father) && (
        <div>
          <span className="font-medium">Parents:</span>
          {parents.mother && (
            <span className="ml-1">
              Mother: {parents.mother.pet_name}
              {parents.father && ", "}
            </span>
          )}
          {parents.father && (
            <span className="ml-1">
              Father: {parents.father.pet_name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PetMetadata;
