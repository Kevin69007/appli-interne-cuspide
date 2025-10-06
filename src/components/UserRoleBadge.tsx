
import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  role: 'admin' | 'moderator' | 'user';
  className?: string;
}

const UserRoleBadge = ({ role, className = "" }: UserRoleBadgeProps) => {
  if (role === 'user') return null;

  const getVariant = () => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getLabel = () => {
    switch (role) {
      case 'admin': return 'A';
      case 'moderator': return 'M';
      default: return '';
    }
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={`ml-2 text-white font-bold ${className}`}
    >
      {getLabel()}
    </Badge>
  );
};

export default UserRoleBadge;
