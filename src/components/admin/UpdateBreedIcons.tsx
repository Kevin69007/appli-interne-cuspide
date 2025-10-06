
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage } from "lucide-react";

const UpdateBreedIcons = () => {
  const [iconFiles, setIconFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIconFiles(files);
    }
  };

  const handleBulkUpload = async () => {
    if (!iconFiles || iconFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select icon files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement actual bulk upload logic
      toast({
        title: "Feature Coming Soon",
        description: `Bulk upload functionality for ${iconFiles.length} files will be implemented soon`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload breed icons",
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
          <FileImage className="h-5 w-5" />
          Bulk Update Breed Icons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="iconFiles">Select Multiple Icon Files</Label>
          <Input
            id="iconFiles"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Select multiple icon files. File names should match breed names (e.g., "golden-retriever.png").
          </p>
        </div>

        {iconFiles && iconFiles.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              Selected {iconFiles.length} file(s) for upload
            </p>
          </div>
        )}

        <Button 
          onClick={handleBulkUpload}
          disabled={isUploading || !iconFiles || iconFiles.length === 0}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Bulk Upload Icons"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpdateBreedIcons;
