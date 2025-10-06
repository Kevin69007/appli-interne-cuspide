
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ShelterPetImage from "./ShelterPetImage";
import ShelterPetInfo from "./ShelterPetInfo";
import ShelterPetStats from "./ShelterPetStats";
import ShelterPetActions from "./ShelterPetActions";

interface ShelterPetCardProps {
  pet: any;
  onAdopt: () => void;
}

const ShelterPetCard = ({ pet, onAdopt }: ShelterPetCardProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <ShelterPetImage pet={pet} />
        <ShelterPetInfo pet={pet} />
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <ShelterPetStats pet={pet} />

        {pet.description && (
          <p className="text-sm text-muted-foreground">{pet.description}</p>
        )}

        <ShelterPetActions pet={pet} onAdopt={onAdopt} />
      </CardContent>
    </Card>
  );
};

export default ShelterPetCard;
