
interface PetDescriptionProps {
  description?: string;
  petId: string;
  isOwnProfile?: boolean;
  onUpdate?: () => void;
}

const PetDescription = ({ description }: PetDescriptionProps) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-800">Description</h4>
      <p className="text-gray-600 text-sm">
        {description || "No description available."}
      </p>
    </div>
  );
};

export default PetDescription;
