
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ShareProfileButtonProps {
  petId: string;
  petName: string;
}

const ShareProfileButton = ({ petId, petName }: ShareProfileButtonProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔧 ShareProfileButton mounted for pet:', petName, 'ID:', petId);
  }, [petId, petName]);

  const profileUrl = `${window.location.origin}/pet-profile/${petId}`;
  const embedCode = `[pet-profile]${petId}[/pet-profile]`;

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      console.log('📋 ShareProfileButton - copied to clipboard:', fieldName);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      });
      
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('❌ ShareProfileButton - copy failed:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  console.log('🎨 ShareProfileButton rendering for:', petName);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white hover:bg-gray-50 border-pink-200 text-pink-700 hover:text-pink-800 shadow-sm"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share {petName}'s Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="profile-url">Profile Link</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="profile-url"
                value={profileUrl}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleCopy(profileUrl, "Profile Link")}
                variant="outline"
              >
                {copiedField === "Profile Link" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="embed-code">Forum Embed Code</Label>
            <div className="flex gap-2 mt-1">
              <Textarea
                id="embed-code"
                value={embedCode}
                readOnly
                className="flex-1 min-h-[60px]"
              />
              <Button
                size="sm"
                onClick={() => handleCopy(embedCode, "Embed Code")}
                variant="outline"
                className="self-start"
              >
                {copiedField === "Embed Code" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paste this code in forum posts to embed the pet profile
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProfileButton;
