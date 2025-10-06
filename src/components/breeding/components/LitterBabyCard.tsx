
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, Users, Shield, Search, Edit2, Check, X, Sparkles } from "lucide-react";
import { getBreedImage } from "@/utils/breedImages";

interface LitterBabyCardProps {
  baby: any;
  onNameUpdate: (babyId: string, newName: string) => void;
  isEditable: boolean;
}

const LitterBabyCard = ({ baby, onNameUpdate, isEditable }: LitterBabyCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(baby.pet_name);
  const [imageError, setImageError] = useState(false);

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== baby.pet_name) {
      onNameUpdate(baby.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(baby.pet_name);
    setIsEditing(false);
  };

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'friendliness': return <Heart className="w-3 h-3" />;
      case 'playfulness': return <Zap className="w-3 h-3" />;
      case 'energy': return <Sparkles className="w-3 h-3" />;
      case 'loyalty': return <Shield className="w-3 h-3" />;
      case 'curiosity': return <Search className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatColor = (statName: string) => {
    switch (statName) {
      case 'friendliness': return 'text-pink-600';
      case 'playfulness': return 'text-purple-600';
      case 'energy': return 'text-yellow-600';
      case 'loyalty': return 'text-blue-600';
      case 'curiosity': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Use breed from baby data to ensure icon consistency (breed field is immutable)
  const breedImageUrl = getBreedImage(baby.breed);

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-all duration-200">
      <CardContent className="p-4">
        {/* Baby Image - Uses breed for consistent icon */}
        <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-600">
              <Users className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium">{baby.breed}</span>
            </div>
          ) : (
            <img
              src={breedImageUrl}
              alt={`${baby.breed} baby`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Baby Info */}
        <div className="space-y-3">
          {/* Name Section */}
          <div className="text-center">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-center font-bold"
                  maxLength={50}
                />
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={handleSaveName} variant="default">
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" onClick={handleCancelEdit} variant="outline">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-bold text-pink-800 text-sm truncate">{baby.pet_name}</h3>
                  {isEditable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{baby.breed}</p>
              </div>
            )}
          </div>

          {/* Gender Badge */}
          <div className="flex justify-center">
            <Badge variant={baby.gender === 'Female' ? 'default' : 'secondary'} className="text-xs">
              {baby.gender}
            </Badge>
          </div>

          {/* Stats */}
          <div className="bg-pink-50 rounded-lg p-3">
            <div className="grid grid-cols-1 gap-2">
              {[
                { name: 'friendliness', value: baby.friendliness },
                { name: 'playfulness', value: baby.playfulness },
                { name: 'energy', value: baby.energy },
                { name: 'loyalty', value: baby.loyalty },
                { name: 'curiosity', value: baby.curiosity }
              ].map((stat) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className={`flex items-center gap-1 ${getStatColor(stat.name)}`}>
                    {getStatIcon(stat.name)}
                    <span className="text-xs font-medium capitalize">{stat.name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Birthday */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Born: {new Date(baby.birthday).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LitterBabyCard;
