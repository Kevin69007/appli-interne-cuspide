
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wrench } from "lucide-react";

const CreateOddStatPet = () => {
  const [petName, setPetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!petName.trim()) {
      toast({
        title: "Pet Name Required",
        description: "Please enter a name for the pet",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // TODO: Implement pet creation logic
      toast({
        title: "Feature Coming Soon",
        description: "Odd stat pet creation will be implemented soon",
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create odd stat pet",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Create Odd Stat Pet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="petName">Pet Name</Label>
          <Input
            id="petName"
            type="text"
            placeholder="Enter pet name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={handleCreate}
          disabled={isCreating || !petName.trim()}
          className="w-full"
        >
          <Wrench className="h-4 w-4 mr-2" />
          {isCreating ? "Creating..." : "Create Odd Stat Pet"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateOddStatPet;
