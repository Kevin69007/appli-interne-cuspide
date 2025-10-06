
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { renderOddieStats, renderBreedStats, hasOddStats } from "@/utils/statBarUtils";

interface ForumPetStatsProps {
  pet: {
    friendliness: number;
    playfulness: number;
    energy: number;
    loyalty: number;
    curiosity: number;
    breed?: string;
    pet_name?: string;
    pets?: {
      name?: string;
    };
    extra_stats?: any;
  };
}

const ForumPetStats = ({ pet }: ForumPetStatsProps) => {
  const getStatColor = (value: number) => {
    const percentage = ((value - 0) / (100 - 0)) * 100;
    if (percentage >= 60) return "text-green-600";
    return "text-gray-600";
  };

  const isOddStatPet = hasOddStats(pet);

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-800">Pet Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-pink-50 p-3 rounded-lg space-y-4">
            {isOddStatPet ? (
              renderOddieStats(pet, getStatColor, true)
            ) : (
              renderBreedStats(pet, getStatColor, true)
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumPetStats;
