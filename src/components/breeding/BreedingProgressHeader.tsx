
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Heart } from "lucide-react";

interface BreedingProgressHeaderProps {
  onBack: () => void;
  timeRemaining: string;
}

const BreedingProgressHeader = ({ onBack, timeRemaining }: BreedingProgressHeaderProps) => {
  return (
    <>
      <Button onClick={onBack} variant="outline" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Breeding
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Breeding Progress
          </CardTitle>
          <CardDescription>
            {timeRemaining}
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
};

export default BreedingProgressHeader;
