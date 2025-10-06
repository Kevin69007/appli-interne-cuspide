
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertCircle } from "lucide-react";
import ParentCard from "../ParentCard";

interface UserPet {
  id: string;
  pet_name: string;
  breed: string;
  gender: string;
  pets?: {
    name: string;
    type: string;
  };
  user_id: string;
  breeding_cooldown_until?: string;
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
}

interface ParentSelectionFormProps {
  selectedParent1: UserPet | null;
  selectedParent2: UserPet | null;
  firstParentOptions: Array<{ value: string; label: string; pet: UserPet }>;
  secondParentOptions: Array<{ value: string; label: string; pet: UserPet }>;
  userLicenseCount: number;
  onParent1Select: (pet: UserPet | null) => void;
  onParent2Select: (pet: UserPet | null) => void;
  onStartBreeding: () => void;
  isBreeding: boolean;
}

const ParentSelectionForm = ({
  selectedParent1,
  selectedParent2,
  firstParentOptions,
  secondParentOptions,
  userLicenseCount,
  onParent1Select,
  onParent2Select,
  onStartBreeding,
  isBreeding
}: ParentSelectionFormProps) => {
  return (
    <>
      {/* Litter License Warning */}
      {userLicenseCount < 2 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-orange-800">Insufficient Litter Licenses</h4>
            <p className="text-sm text-orange-700 mt-1">
              You need 2 litter licenses to start breeding (one for each pet). You currently have {userLicenseCount}.
              Purchase more in the "Purchase Licenses" tab.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Parent Selection */}
        <div>
          <h3 className="font-semibold mb-3 text-pink-700">First Parent</h3>
          {selectedParent1 ? (
            <div className="space-y-3">
              <ParentCard
                pet={selectedParent1}
                title="First Parent"
                isSelected={true}
                onClick={() => onParent1Select(null)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onParent1Select(null)}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          ) : (
            <div>
              {firstParentOptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No pets available for breeding. You need to adopt some pets first.
                </p>
              ) : (
                <Select onValueChange={(value) => {
                  const pet = firstParentOptions.find(p => p.value === value)?.pet;
                  if (pet) onParent1Select(pet);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {firstParentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* Second Parent Selection */}
        <div>
          <h3 className="font-semibold mb-3 text-pink-700">Second Parent</h3>
          {selectedParent2 ? (
            <div className="space-y-3">
              <ParentCard
                pet={selectedParent2}
                title="Second Parent"
                isSelected={true}
                onClick={() => onParent2Select(null)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onParent2Select(null)}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          ) : (
            <div>
              {!selectedParent1 ? (
                <p className="text-muted-foreground text-center py-4">
                  Select the first parent to see compatible pets
                </p>
              ) : secondParentOptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No compatible pets available for breeding with {selectedParent1.pet_name}. You need pets of the opposite gender and same species.
                </p>
              ) : (
                <Select onValueChange={(value) => {
                  const pet = secondParentOptions.find(p => p.value === value)?.pet;
                  if (pet) onParent2Select(pet);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {secondParentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedParent1 && selectedParent2 && userLicenseCount >= 2 && (
            <p className="text-green-600">
              ✓ Ready to breed {selectedParent1.pet_name} and {selectedParent2.pet_name} (2 licenses will be used)
            </p>
          )}
          {userLicenseCount < 2 && (
            <p className="text-orange-600">
              ⚠ Need 2 litter licenses (have {userLicenseCount})
            </p>
          )}
        </div>
        
        <Button
          onClick={onStartBreeding}
          disabled={!selectedParent1 || !selectedParent2 || isBreeding || userLicenseCount < 2}
          className="bg-pink-600 hover:bg-pink-700"
        >
          {isBreeding ? "Starting..." : "Start Breeding"}
        </Button>
      </div>
    </>
  );
};

export default ParentSelectionForm;
