
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Users, Clock, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, isAfter, startOfDay, addDays } from "date-fns";
import LitterBabyCard from "./LitterBabyCard";

interface LitterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  breedingPair: any;
  onUpdate?: () => void;
  isPublicView?: boolean;
}

const LitterDetailModal = ({ isOpen, onClose, breedingPair, onUpdate, isPublicView = false }: LitterDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [babies, setBabies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectingBabies, setCollectingBabies] = useState(false);

  useEffect(() => {
    if (isOpen && breedingPair) {
      fetchBabies();
    }
  }, [isOpen, breedingPair]);

  const fetchBabies = async () => {
    if (!breedingPair?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("litter_babies")
        .select("*")
        .eq("breeding_pair_id", breedingPair.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching babies:", error);
        return;
      }

      setBabies(data || []);
    } catch (error) {
      console.error("Error fetching babies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectBabies = async () => {
    if (!user?.id || !breedingPair?.id) return;

    // Check if it's midnight or later on the wean date
    const now = new Date();
    const weanDate = new Date(breedingPair.wean_date);
    const midnightOnWeanDate = startOfDay(weanDate);
    
    if (now < midnightOnWeanDate) {
      const timeUntilMidnight = formatDistanceToNow(midnightOnWeanDate, { addSuffix: true });
      toast({
        title: "Weaning Not Available Yet",
        description: `Babies can only be weaned starting at midnight on ${weanDate.toLocaleDateString()}. Time remaining: ${timeUntilMidnight}`,
        variant: "destructive",
      });
      return;
    }

    setCollectingBabies(true);
    try {
      console.log("🍼 Collecting babies for breeding pair:", breedingPair.id);
      
      const { data, error } = await supabase.rpc('collect_breeding_babies', {
        breeding_pair_id_param: breedingPair.id,
        user_id_param: user.id
      });

      if (error) {
        console.error("❌ Error collecting babies:", error);
        throw error;
      }

      console.log("✅ Babies collection result:", data);

      // Type assertion for the RPC response
      const result = data as { success?: boolean; babies_transferred?: number; error?: string };

      if (result?.success) {
        toast({
          title: "Babies Collected!",
          description: `Successfully collected ${result.babies_transferred} babies into your collection`,
        });
        
        onUpdate?.();
        onClose();
      } else {
        throw new Error(result?.error || "Failed to collect babies");
      }
    } catch (error: any) {
      console.error("❌ Baby collection failed:", error);
      toast({
        title: "Collection Failed",
        description: error.message || "Failed to collect babies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCollectingBabies(false);
    }
  };

  const updateBabyName = async (babyId: string, newName: string) => {
    try {
      // Update only the pet_name field, preserving breed and other data
      const { error } = await supabase
        .from("litter_babies")
        .update({ pet_name: newName })
        .eq("id", babyId);

      if (error) throw error;

      // Update local state
      setBabies(prev => prev.map(baby => 
        baby.id === babyId ? { ...baby, pet_name: newName } : baby
      ));

      toast({
        title: "Name Updated",
        description: "Baby's name has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating baby name:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update baby's name",
        variant: "destructive",
      });
    }
  };

  if (!breedingPair) return null;

  const isWeaned = breedingPair.is_weaned;
  const canCollect = isWeaned && babies.length > 0 && !isPublicView;
  
  // Check if it's past midnight on wean date for UI display
  const now = new Date();
  const weanDate = new Date(breedingPair.wean_date);
  const midnightOnWeanDate = startOfDay(weanDate);
  const canWeanAtMidnight = now >= midnightOnWeanDate;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5" />
            Litter #{breedingPair.litter_number} Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Litter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Parents: {breedingPair.parent1_name} × {breedingPair.parent2_name}
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Born: {new Date(breedingPair.birth_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Wean Date: {new Date(breedingPair.wean_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {babies.length} babies
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant={breedingPair.is_born ? "default" : "secondary"}>
                  {breedingPair.is_born ? "Born" : "Not Born"}
                </Badge>
                <Badge variant={isWeaned ? "default" : "secondary"}>
                  {isWeaned ? "Weaned" : canWeanAtMidnight ? "Ready to Wean" : "Weaning"}
                </Badge>
                <Badge variant={breedingPair.is_completed ? "outline" : "default"}>
                  {breedingPair.is_completed ? "Completed" : "Active"}
                </Badge>
              </div>
              
              {!canWeanAtMidnight && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>
                      Babies will be ready for weaning at midnight on {weanDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Babies Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading babies...</p>
            </div>
          ) : babies.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-4">Litter Babies ({babies.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {babies.map((baby) => (
                  <LitterBabyCard 
                    key={baby.id}
                    baby={baby}
                    onNameUpdate={updateBabyName}
                    isEditable={!breedingPair.is_completed && !isPublicView}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No babies found</p>
                <p className="text-sm text-muted-foreground">
                  {breedingPair.is_born ? "Babies should appear here once they're born" : "Babies will appear after birth"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {canCollect && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={handleCollectBabies}
                disabled={collectingBabies}
                className="bg-green-600 hover:bg-green-700"
              >
                {collectingBabies ? "Collecting..." : `Collect All Babies (${babies.length})`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LitterDetailModal;
