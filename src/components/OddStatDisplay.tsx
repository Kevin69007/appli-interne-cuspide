
import { renderCompactStatBar } from "@/utils/statBarUtils";

interface OddStatDisplayProps {
  pet: {
    friendliness: number;
    playfulness: number;
    energy: number;
    loyalty: number;
    curiosity: number;
    breed?: string;
    pets?: {
      name?: string;
    };
    extra_stats?: any;
  };
  getStatColor: (value: number) => string;
}

const OddStatDisplay = ({ pet, getStatColor }: OddStatDisplayProps) => {
  const stats = [
    { name: "Friendliness", short: "Friend", value: pet.friendliness, min: 0, max: 100 },
    { name: "Playfulness", short: "Play", value: pet.playfulness, min: 0, max: 100 },
    { name: "Energy", short: "Energy", value: pet.energy, min: 0, max: 100 },
    { name: "Loyalty", short: "Loyal", value: pet.loyalty, min: 0, max: 100 },
    { name: "Curiosity", short: "Curious", value: pet.curiosity, min: 0, max: 100 }
  ];

  console.log('🔍 OddStatDisplay - Raw pet stats:', {
    friendliness: pet.friendliness,
    playfulness: pet.playfulness,
    energy: pet.energy,
    loyalty: pet.loyalty,
    curiosity: pet.curiosity
  });

  return (
    <div className="space-y-2">
      {stats.map((stat) => {
        console.log(`📊 OddStatDisplay - ${stat.name}: raw=${stat.value}, display will show=${stat.value}`);
        return (
          <div key={stat.name} className="flex items-center justify-between">
            <span className="text-xs font-medium w-16" title={stat.name}>{stat.short}</span>
            <div className="flex-1 mx-2 relative" style={{ minWidth: '120px' }}>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-primary"
                  style={{ width: `${Math.min(100, Math.max(0, stat.value))}%` }}
                />
              </div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
                style={{ left: `${Math.min(97.5, Math.max(2.5, (stat.value / 100) * 100))}%` }}
              >
                <div className="w-6 h-3 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm bg-white text-gray-800 border border-gray-300">
                  <span className="drop-shadow-sm">{stat.value}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OddStatDisplay;
