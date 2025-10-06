
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Clock, CheckCircle, ShoppingCart, Baby, Users } from "lucide-react";

interface BreedingHeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activePairsCount: number;
  completedPairsCount: number;
}

const BreedingHeader = ({ 
  currentTab, 
  onTabChange, 
  activePairsCount, 
  completedPairsCount 
}: BreedingHeaderProps) => {
  const tabs = [
    {
      id: "start-breeding",
      label: "Start Breeding",
      icon: Heart,
      description: "Create new breeding pairs"
    },
    {
      id: "active-pairs",
      label: "Active Pairs",
      icon: Clock,
      description: `${activePairsCount} pairs in progress`,
      count: activePairsCount
    },
    {
      id: "completed",
      label: "Past Litters",
      icon: Baby,
      description: `${completedPairsCount} completed litters`,
      count: completedPairsCount
    },
    {
      id: "nursery",
      label: "Nursery",
      icon: Users,
      description: "View community litters"
    },
    {
      id: "purchase-licenses",
      label: "License Shop",
      icon: ShoppingCart,
      description: "Buy & sell litter licenses"
    }
  ];

  return (
    <div className="mb-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-pink-800 mb-4">🐾 Breeding Center 🐾</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Welcome to the breeding center! Create new pet combinations, manage active breeding pairs, 
          collect your adorable babies, and explore the community nursery.  
        </p>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 mb-6">
        <CardContent className="p-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onTabChange(tab.id)}
                  className={`h-auto p-4 flex flex-col items-center gap-2 relative ${
                    isActive 
                      ? "bg-pink-600 hover:bg-pink-700 text-white" 
                      : "hover:bg-pink-50 text-pink-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-bold">
                        {tab.count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs opacity-80 text-center">{tab.description}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreedingHeader;
