
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface BreedingCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

const BreedingCard = ({ title, description, children, className = "" }: BreedingCardProps) => {
  return (
    <Card className={`bg-white/95 backdrop-blur-sm shadow-xl border-pink-200 overflow-hidden w-full max-w-none ${className}`}>
      <CardHeader className="bg-gradient-to-r from-pink-100 to-purple-100 border-b border-pink-200">
        <CardTitle className="flex items-center gap-2 text-pink-800">
          <Heart className="w-5 h-5 text-red-500" />
          {title}
        </CardTitle>
        <CardDescription className="text-pink-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default BreedingCard;
