
interface ShelterStatsProps {
  petCount: number;
}

const ShelterStats = ({ petCount }: ShelterStatsProps) => {
  return (
    <div className="bg-pink-100 border-2 border-pink-300 rounded-full px-4 py-2 shadow-lg">
      <span className="font-semibold text-gray-800">
        {petCount} pets available for adoption
      </span>
    </div>
  );
};

export default ShelterStats;
