
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Unlock } from "lucide-react";

interface ManualParentReleaseButtonProps {
  breedingPair: any;
  onSuccess?: () => void;
}

const ManualParentReleaseButton = ({ breedingPair, onSuccess }: ManualParentReleaseButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReleasing, setIsReleasing] = useState(false);

  const handleReleaseParents = async () => {
    if (!user || !breedingPair.is_completed) return;

    setIsReleasing(true);
    try {
      console.log("🔓 Manually releasing breeding parents for pair:", breedingPair.id);

      const { error } = await supabase.rpc('release_breeding_parents', {
        breeding_pair_id_param: breedingPair.id
      });

      if (error) {
        console.error("Error releasing parents:", error);
        throw error;
      }

      toast({
        title: "Parents Released",
        description: "The breeding parents have been released and can now be sold or bred again.",
      });

      console.log("✅ Parents successfully released");
      onSuccess?.();

    } catch (error) {
      console.error("❌ Error releasing parents:", error);
      toast({
        title: "Error",
        description: "Failed to release breeding parents. Please try again.",
        variant: "destructive",
      });
    }
    setIsReleasing(false);
  };

  // Only show button if breeding is completed but we want to manually release parents
  if (!breedingPair.is_completed) {
    return null;
  }

  return (
    <Button
      onClick={handleReleaseParents}
      disabled={isReleasing}
      variant="outline"
      size="sm"
      className="text-blue-600 border-blue-200 hover:bg-blue-50"
    >
      <Unlock className="w-4 h-4 mr-2" />
      {isReleasing ? "Releasing..." : "Release Parents"}
    </Button>
  );
};

export default ManualParentReleaseButton;
