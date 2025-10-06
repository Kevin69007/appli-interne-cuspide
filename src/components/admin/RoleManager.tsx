
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRoleManagement } from "@/hooks/useRoleManagement";
import { Shield, Search, UserCheck, UserX } from "lucide-react";

interface User {
  id: string;
  username: string;
  email?: string;
  paw_dollars: number;
  roles: string[];
}

const RoleManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { grantRole, revokeRole, getUserRoles, loading: roleLoading } = useRoleManagement();

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, paw_dollars")
        .ilike("username", `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const roles = await getUserRoles(user.id);
          return { ...user, roles };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, action: 'grant' | 'revoke', role: 'admin' | 'moderator') => {
    const success = action === 'grant' 
      ? await grantRole(userId, role)
      : await revokeRole(userId, role);

    if (success) {
      // Refresh the user's roles
      const updatedRoles = await getUserRoles(userId);
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, roles: updatedRoles } : user
        )
      );
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm) {
        searchUsers();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search users by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={searchUsers} disabled={loading} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {users.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{user.username}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.paw_dollars} PD
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)}>
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">user</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Admin Role Controls */}
                  {user.roles.includes('admin') ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRoleChange(user.id, 'revoke', 'admin')}
                      disabled={roleLoading}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Remove Admin
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRoleChange(user.id, 'grant', 'admin')}
                      disabled={roleLoading}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Make Admin
                    </Button>
                  )}

                  {/* Moderator Role Controls */}
                  {user.roles.includes('moderator') ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRoleChange(user.id, 'revoke', 'moderator')}
                      disabled={roleLoading}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Remove Mod
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRoleChange(user.id, 'grant', 'moderator')}
                      disabled={roleLoading}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Make Mod
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {searchTerm && users.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-4">
            No users found matching "{searchTerm}"
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleManager;
