
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { renderOddieStats } from "@/utils/statBarUtils";

const DuplicatePatternDemo = () => {
  const getStatColor = (value: number) => {
    const percentage = ((value - 0) / (100 - 0)) * 100;
    if (percentage >= 60) return "text-green-600";
    return "text-gray-600";
  };

  // Test pet with loyalty_friendliness duplicate pattern
  const testPet = {
    id: 'demo-pet-1',
    pet_name: 'Demo Pet #798',
    breed: 'Golden Retriever',
    is_odd_stat: true,
    friendliness: 65,
    playfulness: 45,
    energy: 72,
    loyalty: 58,
    curiosity: 39,
    extra_stats: {
      duplicate_pattern: 'loyalty_friendliness',
      friendliness_alt: 42,
      loyalty_alt: 78
    }
  };

  console.log('🎯 Demo pet data:', testPet);

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-bold text-pink-800">Duplicate Pattern Demo</h2>
      
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800">Test Pet with Loyalty/Friendliness Duplicates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              This pet should show duplicate Friendliness (65, 42) and Loyalty (58, 78) stats:
            </p>
            <div className="bg-pink-50 p-3 rounded-lg space-y-4">
              {renderOddieStats(testPet, getStatColor, true)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DuplicatePatternDemo;
