import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, FileAudio } from "lucide-react";

interface AudioUploaderProps {
  onFileSelected: (file: File | null) => void;
}

export const AudioUploader = ({ onFileSelected }: AudioUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["audio/mp3", "audio/wav", "audio/m4a", "audio/mpeg"];
      if (!validTypes.includes(file.type)) {
        alert("Format audio non supporté. Utilisez MP3, WAV ou M4A.");
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("Fichier trop volumineux. Taille maximale: 50 MB.");
        return;
      }

      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    onFileSelected(null);
  };

  return (
    <div className="space-y-2">
      <Label>Enregistrement audio (optionnel)</Label>
      
      {!selectedFile ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Cliquez pour uploader un fichier audio
            </span>
            <span className="text-xs text-muted-foreground">
              MP3, WAV, M4A (max 50MB)
            </span>
          </div>
          <input
            type="file"
            className="hidden"
            accept="audio/mp3,audio/wav,audio/m4a,audio/mpeg"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <FileAudio className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
