
/**
 * Security status indicator component
 */

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

type SecurityStatus = 'secure' | 'warning' | 'critical';

export const SecurityStatusIndicator = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SecurityStatus>('critical');

  useEffect(() => {
    if (user) {
      setStatus('secure');
    } else {
      setStatus('critical');
    }
  }, [user]);

  const getStatusConfig = () => {
    switch (status) {
      case 'secure':
        return {
          icon: ShieldCheck,
          label: 'Secure',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'warning':
        return {
          icon: ShieldAlert,
          label: 'Session Warning',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'critical':
        return {
          icon: Shield,
          label: 'Not Authenticated',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs">{config.label}</span>
    </Badge>
  );
};
