
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

const PetsEmptyState = () => {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No pets yet</h3>
        <p className="text-gray-500">Visit the adoption center to find your first companion!</p>
      </CardContent>
    </Card>
  );
};

export default PetsEmptyState;
