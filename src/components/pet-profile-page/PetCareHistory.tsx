
import { Link } from "react-router-dom";
import { usePetCareHistory } from "@/hooks/usePetCareHistory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Droplets, Cookie } from "lucide-react";

interface PetCareHistoryProps {
  petId: string;
}

const PetCareHistory = ({ petId }: PetCareHistoryProps) => {
  const { careHistory, loading, error } = usePetCareHistory(petId);

  console.log("🔍 PetCareHistory: Rendering with data:", { 
    petId,
    careHistoryLength: careHistory?.length || 0,
    careHistory: careHistory?.slice(0, 3) // Log first 3 items for debugging
  });

  const getActionType = (description: string) => {
    if (description.toLowerCase().includes('fed')) {
      return 'feeding';
    } else if (description.toLowerCase().includes('water')) {
      return 'watering';
    }
    return 'unknown';
  };

  const getActionText = (description: string) => {
    const actionType = getActionType(description);
    
    if (actionType === 'feeding') {
      if (description.includes('bulk')) {
        return 'Fed (bulk)';
      } else if (description.includes('another user\'s pet')) {
        return 'Fed (friend\'s pet)';
      } else if (description.includes('Food Bag')) {
        return 'Fed (from pet card)';
      }
      return 'Fed';
    } else if (actionType === 'watering') {
      if (description.includes('another user\'s pet')) {
        return 'Watered (friend\'s pet)';
      } else if (description.includes('bulk')) {
        return 'Watered (bulk)';
      }
      return 'Watered';
    }
    
    return description;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-2">Failed to load care history</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (careHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No care history found for this pet yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Start feeding or watering this pet to see care history!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">
          Showing last {careHistory.length} care actions
        </span>
      </div>
      
      {careHistory.map((transaction) => {
        console.log("🔄 Rendering transaction:", {
          id: transaction.id,
          description: transaction.description,
          user_id: transaction.user_id,
          profiles: transaction.profiles
        });

        const actionType = getActionType(transaction.description);
        const actionText = getActionText(transaction.description);

        return (
          <div key={transaction.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            {/* Action Icon */}
            <div className="flex-shrink-0">
              {actionType === 'feeding' ? (
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Cookie className="w-4 h-4 text-orange-600" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>

            {/* Action Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {actionText}
                </span>
                <span className="text-muted-foreground">by</span>
                {transaction.profiles?.username ? (
                  <Link 
                    to={`/profile/${encodeURIComponent(transaction.profiles.username)}`}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={transaction.profiles.profile_image_url} />
                      <AvatarFallback className="bg-pink-100 text-pink-800 text-xs">
                        {transaction.profiles.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-pink-600 hover:text-pink-700">
                      {transaction.profiles.username}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        ?
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">
                      Unknown user
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Points Earned */}
            {transaction.paw_points && (
              <div className="flex-shrink-0">
                <span className="text-sm font-medium text-green-600">
                  +{transaction.paw_points} XP
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PetCareHistory;
