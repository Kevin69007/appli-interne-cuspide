
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, Eye, Trash2, Edit } from "lucide-react";

const AdminPermissionsInfo = () => {
  const permissions = [
    {
      category: "User Management",
      icon: <Users className="h-4 w-4" />,
      permissions: [
        "View all user profiles and data",
        "Ban/unban users",
        "Grant and revoke admin/moderator roles",
        "Search and manage user accounts"
      ]
    },
    {
      category: "Content Management", 
      icon: <Edit className="h-4 w-4" />,
      permissions: [
        "Edit and delete any forum posts",
        "Edit and delete any forum replies", 
        "Pin/unpin forum posts",
        "Moderate all user-generated content"
      ]
    },
    {
      category: "System Administration",
      icon: <Settings className="h-4 w-4" />,
      permissions: [
        "Access admin dashboard",
        "Manage daily rewards system",
        "Create and manage pets",
        "Fix over-stat pets and breeding issues",
        "Manage breed icons and pet data"
      ]
    },
    {
      category: "Monitoring & Security",
      icon: <Eye className="h-4 w-4" />,
      permissions: [
        "View security audit logs",
        "View post view statistics",
        "Monitor system security events",
        "Access detailed user analytics"
      ]
    }
  ];

  const roleInfo = [
    {
      role: "Admin",
      color: "destructive" as const,
      description: "Full system access - can manage users, content, and system settings"
    },
    {
      role: "Moderator", 
      color: "secondary" as const,
      description: "Content moderation access - can manage posts and user behavior"
    },
    {
      role: "User",
      color: "outline" as const,
      description: "Standard user access - can use all regular features"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Permissions & Roles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Role Hierarchy */}
        <div>
          <h3 className="font-semibold mb-3">Role Hierarchy</h3>
          <div className="space-y-2">
            {roleInfo.map((role) => (
              <div key={role.role} className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant={role.color}>{role.role}</Badge>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Categories */}
        <div>
          <h3 className="font-semibold mb-3">Admin Permissions</h3>
          <div className="grid gap-4">
            {permissions.map((category) => (
              <div key={category.category} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {category.icon}
                  <h4 className="font-medium">{category.category}</h4>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {category.permissions.map((permission, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Security Note:</strong> Admin roles should be granted carefully. 
            Admins have full system access and can modify critical data and settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPermissionsInfo;
