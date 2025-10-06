
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface PetIdSearchProps {
  onSearchPet: (petNumber: number) => void;
  isSearching: boolean;
}

const PetIdSearch = ({ onSearchPet, isSearching }: PetIdSearchProps) => {
  const [petNumber, setPetNumber] = useState<number>(1);

  const handleIncrement = () => {
    setPetNumber(prev => prev + 1);
  };

  const handleDecrement = () => {
    setPetNumber(prev => Math.max(1, prev - 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setPetNumber(Math.max(1, value));
  };

  const handleSearch = () => {
    if (petNumber > 0) {
      onSearchPet(petNumber);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-purple-100 border-2 border-purple-300 rounded-full px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800 text-sm">Search Pet ID:</span>
        
        <div className="flex items-center bg-white rounded-full border border-purple-200 overflow-hidden">
          <Input
            type="number"
            value={petNumber}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-16 text-center border-0 focus:ring-0 text-sm h-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            min="1"
          />
          
          <div className="flex flex-col border-l border-purple-200">
            <Button
              onClick={handleIncrement}
              variant="ghost"
              size="sm"
              className="h-4 w-6 p-0 hover:bg-purple-50 rounded-none"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              onClick={handleDecrement}
              variant="ghost"
              size="sm"
              className="h-4 w-6 p-0 hover:bg-purple-50 rounded-none"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          variant="secondary"
          size="sm"
          disabled={isSearching}
          className="h-8"
        >
          <Search className="w-4 h-4 mr-1" />
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </div>
  );
};

export default PetIdSearch;
