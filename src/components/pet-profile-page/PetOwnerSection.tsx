
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PetOwnerSectionProps {
  owner: any;
}

const PetOwnerSection = ({ owner }: PetOwnerSectionProps) => {
  return (
    <Card className="bg-white backdrop-blur-sm shadow-lg border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-black text-lg font-semibold text-center">Owned By</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center pt-0 pb-6 px-6">
        <Avatar className="w-24 h-24 border-3 border-gray-300 mb-4 shadow-md">
          <AvatarImage src={owner?.profile_image_url} alt={owner?.username} />
          <AvatarFallback className="bg-gray-100 text-gray-800 text-xl font-bold">
            {owner?.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        {owner?.username && owner.username !== "Unknown User" ? (
          <Link 
            to={`/profile/${encodeURIComponent(owner.username)}`}
            className="font-bold text-xl text-black hover:text-pink-600 cursor-pointer transition-colors"
          >
            {owner.username}
          </Link>
        ) : (
          <h3 className="font-bold text-xl text-black">
            {owner?.username || "Loading..."}
          </h3>
        )}
      </CardContent>
    </Card>
  );
};

export default PetOwnerSection;
