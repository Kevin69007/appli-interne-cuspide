
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Hash } from "lucide-react";

interface PetOrderSettingProps {
  pet: {
    id: string;
    pet_name: string;
    display_order?: number;
  };
  onUpdate: () => void;
}

const PetOrderSetting = ({ pet, onUpdate }: PetOrderSettingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayOrder, setDisplayOrder] = useState(pet.display_order || 0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveOrder = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("user_pets")
        .update({ display_order: displayOrder })
        .eq("id", pet.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Pet display order updated successfully",
      });
      onUpdate();
    } catch (error) {
      console.error("Error updating pet display order:", error);
      toast({
        title: "Error",
        description: "Failed to update pet display order",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  return (
    <div className="flex justify-center w-full">
      <Card className="bg-white/90 backdrop-blur-sm border-pink-200 w-fit">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 text-sm font-medium text-pink-800">
              <Hash className="w-4 h-4" />
              Display Order
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-20 h-10 text-center"
                min="0"
              />
              <Button
                onClick={handleSaveOrder}
                disabled={isUpdating}
                size="sm"
                className="bg-pink-600 hover:bg-pink-700 h-10 w-10 p-0"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Lower numbers show first
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PetOrderSetting;
