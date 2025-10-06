
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ShelterControlsProps {
  lastRefresh: number;
  shelterLoading: boolean;
  onRefresh: () => void;
}

const ShelterControls = ({ lastRefresh, shelterLoading, onRefresh }: ShelterControlsProps) => {
  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs text-gray-500">
        Last updated: {new Date(lastRefresh).toLocaleTimeString()}
      </span>
      <Button onClick={onRefresh} variant="outline" disabled={shelterLoading}>
        <RefreshCw className={`w-4 h-4 mr-2 ${shelterLoading ? 'animate-spin' : ''}`} />
        {shelterLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
};

export default ShelterControls;
