
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import RetroactiveRewardsButton from "./RetroactiveRewardsButton";
import ManualDailyRewardsButton from "./ManualDailyRewardsButton";
import TestDailyRewardsButton from "./TestDailyRewardsButton";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      setUsers([]); // Clear users if search term is empty
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
        alert("Error searching users: " + error.message);
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
        alert("Error toggling ban: " + error.message);
      } else {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, is_banned: !isBanned } : user
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Rewards Management */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Daily Rewards Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TestDailyRewardsButton />
            <ManualDailyRewardsButton />
            <RetroactiveRewardsButton />
          </div>
        </div>
        
        {/* User Management */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">User Management</h2>
          
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* User list */}
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
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
