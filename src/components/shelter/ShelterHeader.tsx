
import { Coins, Package, Home } from "lucide-react";

interface ShelterHeaderProps {
  profile: any;
  user: any;
}

const ShelterHeader = ({ profile, user }: ShelterHeaderProps) => {
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-pink-500 p-3 rounded-full">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-orange-800">PawShelter</h1>
        </div>
        <p className="text-xl text-muted-foreground">Give a loving home to pets in need</p>
      </div>
      
      {user && profile && (
        <div className="flex gap-3">
          <div className="bg-pink-100 border-2 border-pink-300 rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-800">{profile.paw_dollars} PD</span>
            </div>
          </div>
          <div className="bg-pink-100 border-2 border-pink-300 rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">{profile.paw_points} PP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShelterHeader;
