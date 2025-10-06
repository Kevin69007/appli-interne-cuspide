
import { Card, CardContent } from "@/components/ui/card";
import { renderBreedStats } from "@/utils/statBarUtils";

interface PetStatsSectionProps {
  pet: any;
}

const PetStatsSection = ({ pet }: PetStatsSectionProps) => {
  const getStatColor = (value: number) => {
    if (value >= 60) return "text-green-600";
    if (value >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const statBars = renderBreedStats(pet, getStatColor, false);

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-200">
      <CardContent className="flex justify-center p-4">
        <div className="space-y-4 w-full max-w-md">
          {statBars}
        </div>
      </CardContent>
    </Card>
  );
};

export default PetStatsSection;
