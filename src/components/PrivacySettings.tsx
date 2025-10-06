
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, MessageCircle, UtensilsCrossed } from "lucide-react";

const PrivacySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [feedingPrivacy, setFeedingPrivacy] = useState("user_only");
  const [messagePrivacy, setMessagePrivacy] = useState("everyone");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
      setFeedingPrivacy(data.feeding_privacy || "user_only");
      setMessagePrivacy(data.message_privacy || "everyone");
    }
  };

  const updatePrivacySettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          feeding_privacy: feedingPrivacy,
          message_privacy: messagePrivacy
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>Control who can interact with your pets and send you messages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Who can feed your pets?
          </Label>
          <Select value={feedingPrivacy} onValueChange={setFeedingPrivacy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user_only">Only me</SelectItem>
              <SelectItem value="friends_only">Friends only</SelectItem>
              <SelectItem value="everyone">Everyone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Who can send you messages?
          </Label>
          <Select value={messagePrivacy} onValueChange={setMessagePrivacy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friends_only">Friends only</SelectItem>
              <SelectItem value="everyone">Everyone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={updatePrivacySettings} disabled={loading} className="w-full">
          Save Privacy Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
