
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const UpdateBreedIcon = () => {
  const [breedName, setBreedName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
    }
  };

  const handleUpload = async () => {
    if (!breedName.trim() || !iconFile) {
      toast({
        title: "Missing Information",
        description: "Please enter a breed name and select an icon file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement actual upload logic
      toast({
        title: "Feature Coming Soon",
        description: "Breed icon upload functionality will be implemented soon",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload breed icon",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Update Single Breed Icon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="breedName">Breed Name</Label>
          <Input
            id="breedName"
            type="text"
            placeholder="Enter breed name (e.g., Golden Retriever)"
            value={breedName}
            onChange={(e) => setBreedName(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="iconFile">Icon File</Label>
          <Input
            id="iconFile"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <Button 
          onClick={handleUpload}
          disabled={isUploading || !breedName.trim() || !iconFile}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload Breed Icon"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpdateBreedIcon;
