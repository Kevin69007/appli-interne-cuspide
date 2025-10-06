
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, CreditCard } from "lucide-react";

const PawClubSection = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            PawClub Membership
            <Badge variant="outline" className="ml-2">Coming Soon</Badge>
          </CardTitle>
          <CardDescription>
            Exclusive benefits and premium features for dedicated pet carers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Basic</CardTitle>
                <div className="text-2xl font-bold">$4.99<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">Coming Soon</Badge>
                <ul className="text-sm space-y-1">
                  <li>• 500 bonus Paw Dollars monthly</li>
                  <li>• Exclusive pet breeds</li>
                  <li>• Priority shelter access</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-300 bg-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Premium
                </CardTitle>
                <div className="text-2xl font-bold">$9.99<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">Coming Soon</Badge>
                <ul className="text-sm space-y-1">
                  <li>• 1200 bonus Paw Dollars monthly</li>
                  <li>• All Basic benefits</li>
                  <li>• Custom pet accessories</li>
                  <li>• Advanced breeding tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  Elite
                </CardTitle>
                <div className="text-2xl font-bold">$19.99<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">Coming Soon</Badge>
                <ul className="text-sm space-y-1">
                  <li>• 3000 bonus Paw Dollars monthly</li>
                  <li>• All Premium benefits</li>
                  <li>• VIP community access</li>
                  <li>• Early feature access</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Purchase Paw Dollars
            <Badge variant="outline" className="ml-2">Coming Soon</Badge>
          </CardTitle>
          <CardDescription>
            Buy Paw Dollars with real money to enhance your pet care experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-lg font-bold">500 PD</div>
                <div className="text-2xl font-bold text-green-600">$4.99</div>
                <Button disabled className="w-full mt-2">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border-blue-300">
              <CardContent className="pt-6">
                <Badge className="mb-2">Popular</Badge>
                <div className="text-lg font-bold">1200 PD</div>
                <div className="text-2xl font-bold text-green-600">$9.99</div>
                <Button disabled className="w-full mt-2">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-lg font-bold">2500 PD</div>
                <div className="text-2xl font-bold text-green-600">$19.99</div>
                <Button disabled className="w-full mt-2">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border-purple-300">
              <CardContent className="pt-6">
                <Badge variant="outline" className="mb-2">Best Value</Badge>
                <div className="text-lg font-bold">5500 PD</div>
                <div className="text-2xl font-bold text-green-600">$39.99</div>
                <Button disabled className="w-full mt-2">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PawClubSection;
