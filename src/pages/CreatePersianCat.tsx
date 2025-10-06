
import ProfileLayout from "@/components/profile/ProfileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const CreatePersianCatPage = () => {
  return (
    <ProfileLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-orange-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-orange-500" />
            </div>
            <CardTitle className="text-2xl text-orange-800">
              Persian Cat Creation Discontinued
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              The Persian cat creation feature has been discontinued and is no longer available.
            </p>
            <p className="text-sm text-muted-foreground">
              Only one special Persian cat with unique lost stats remains in the game: 
              <span className="font-semibold text-purple-600"> EtherealSnailfish</span>
            </p>
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                This feature was removed to maintain game balance and rarity of special pets.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProfileLayout>
  );
};

export default CreatePersianCatPage;
