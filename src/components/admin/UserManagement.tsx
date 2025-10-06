
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search } from "lucide-react";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error("Error searching users:", error);
        toast({
          title: "Search Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setUsers(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    const confirmMessage = isBanned
      ? "Are you sure you want to unban this user?"
      : "Are you sure you want to ban this user?";

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !isBanned })
        .eq("id", userId);

      if (error) {
        console.error("Error toggling ban:", error);
        toast({
          title: "Ban Toggle Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, is_banned: !isBanned } : user
          )
        );
        toast({
          title: "Success",
          description: `User ${isBanned ? 'unbanned' : 'banned'} successfully`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {users.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-semibold">{user.username}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {user.paw_dollars} PD | {user.paw_points} PP | {user.xp} XP
                  </span>
                  {user.is_banned && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      BANNED
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={user.is_banned ? "default" : "destructive"}
                    onClick={() => handleToggleBan(user.id, user.is_banned || false)}
                  >
                    {user.is_banned ? "Unban" : "Ban"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
