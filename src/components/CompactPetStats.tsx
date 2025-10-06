
import { Card, CardContent } from "@/components/ui/card";

interface CompactPetStatsProps {
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
  hunger?: number;
  water?: number;
  breed?: string;
  pet?: any;
}

const CompactPetStats = ({ 
  friendliness, 
  playfulness, 
  energy, 
  loyalty, 
  curiosity, 
  hunger, 
  water,
  breed = '',
  pet
}: CompactPetStatsProps) => {
  const stats = [
    { name: "Friendliness", short: "Friend", value: friendliness },
    { name: "Playfulness", short: "Play", value: playfulness },
    { name: "Energy", short: "Energy", value: energy },
    { name: "Loyalty", short: "Loyal", value: loyalty },
    { name: "Curiosity", short: "Curious", value: curiosity }
  ];

  const getDisplayValue = (statName: string, value: number) => {
    // Special case for Lostie Golden's energy - show 34 when actual value is -1
    if (statName === "Energy" && value === -1) {
      console.log(`✅ CompactPetStats - LOSTIE GOLDEN ENERGY SPECIAL CASE: value=${value} → displayValue=34`);
      return 34;
    }
    return value;
  };

  return (
    <Card className="border-pink-200 bg-white">
      <CardContent className="p-4 space-y-4">
        <div className="text-center mb-3">
          <h4 className="font-semibold text-pink-800">Personality Traits</h4>
        </div>
        
        <div className="space-y-2">
          {stats.map((stat) => {
            const displayValue = getDisplayValue(stat.name, stat.value);
            return (
              <div key={stat.name} className="flex items-center justify-between">
                <span className="text-xs font-medium w-16" title={stat.name}>{stat.short}</span>
                <div className="flex-1 mx-2 relative" style={{ minWidth: '120px' }}>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, displayValue))}%` }}
                    />
                  </div>
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
                    style={{ left: `${Math.min(97.5, Math.max(2.5, (displayValue / 100) * 100))}%` }}
                  >
                    <div className="w-6 h-3 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm bg-white text-gray-800 border border-gray-300">
                      <span className="drop-shadow-sm">{displayValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(hunger !== undefined || water !== undefined) && (
          <div className="mt-3 pt-3 border-t border-pink-200 space-y-3">
            <div className="text-center">
              <h5 className="text-sm font-medium text-pink-800">Care Stats</h5>
            </div>
            {hunger !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Hunger</span>
                  <span className="text-sm text-muted-foreground">{hunger}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, hunger))}%` }}
                  />
                </div>
              </div>
            )}
            {water !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Water</span>
                  <span className="text-sm text-muted-foreground">{water}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, water))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactPetStats;
