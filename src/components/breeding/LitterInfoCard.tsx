
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Clock, CheckCircle } from "lucide-react";

interface LitterInfoCardProps {
  breedingPair: any;
}

const LitterInfoCard = ({ breedingPair }: LitterInfoCardProps) => {
  const isBorn = breedingPair.is_born;
  const isWeaned = breedingPair.is_weaned;
  const isCompleted = breedingPair.is_completed;

  // Don't show "Expected Litter" if pregnancy is finished (babies are born)
  if (isBorn && !isWeaned) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Clock className="w-5 h-5" />
            Weaning Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-blue-800">
            {breedingPair.litter_size} babies are weaning
          </p>
          <p className="text-sm text-blue-600">
            Born: {new Date(breedingPair.birth_date).toLocaleDateString()}
          </p>
          <p className="text-sm text-blue-600">
            Ready to collect: {new Date(breedingPair.wean_date).toLocaleDateString()}
          </p>
          <p className="text-xs text-orange-600 font-medium mt-2">
            Note: Weaning period is 14 days and cannot be bypassed
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Breeding Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-green-800">
            {breedingPair.litter_size} babies collected successfully!
          </p>
          <p className="text-sm text-green-600">
            Born: {new Date(breedingPair.birth_date).toLocaleDateString()}
          </p>
          <p className="text-sm text-green-600">
            Collected: {new Date(breedingPair.wean_date).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show pregnancy status without revealing litter size
  return (
    <Card className="bg-pink-50 border-pink-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-pink-800">
          <Baby className="w-5 h-5" />
          Pregnancy Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium text-pink-800">
          Parents are expecting their litter
        </p>
        <p className="text-sm text-pink-600">
          Due date: {new Date(breedingPair.birth_date).toLocaleDateString()}
        </p>
        <p className="text-sm text-pink-600">
          Collection available: {new Date(breedingPair.wean_date).toLocaleDateString()}
        </p>
        <p className="text-xs text-orange-600 font-medium mt-2">
          Litter size will be revealed when babies are born (1-6 babies possible)
        </p>
      </CardContent>
    </Card>
  );
};

export default LitterInfoCard;
