
import { Card, CardContent } from "@/components/ui/card";
import { Home, Heart } from "lucide-react";

const ShelterEmptyState = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
      <CardContent className="text-center py-16">
        <Home className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">No pets available</h3>
        <p className="text-muted-foreground mb-4">
          All our shelter pets have found loving homes! Check back later for new arrivals.
        </p>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full inline-flex items-center gap-2">
          <Heart className="w-4 h-4" />
          All pets adopted!
        </div>
      </CardContent>
    </Card>
  );
};

export default ShelterEmptyState;
